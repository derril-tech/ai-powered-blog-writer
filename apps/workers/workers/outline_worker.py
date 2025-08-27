# Created automatically by Cursor AI (2024-01-27)

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

import openai
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OutlineSection:
    """Represents a section in the content outline"""
    level: int  # 1 for H1, 2 for H2, 3 for H3
    title: str
    word_count: int
    content: Optional[str] = None
    keywords: Optional[List[str]] = None

@dataclass
class Outline:
    """Complete content outline"""
    post_id: str
    structure: List[OutlineSection]
    total_words: int
    target_keyword: str
    tone: str
    audience: str
    is_locked: bool = False

class OutlineWorker:
    """Worker for generating content outlines using AI"""
    
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        if not self.openai_api_key and not self.anthropic_api_key:
            raise ValueError("Either OPENAI_API_KEY or ANTHROPIC_API_KEY is required")
        
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
    
    async def get_post_data(self, post_id: str) -> Dict[str, Any]:
        """Fetch post data and related information from database"""
        try:
            with self.SessionLocal() as session:
                # Get post data
                post_query = text("""
                    SELECT p.*, k.term as target_keyword, k.settings as keyword_settings
                    FROM posts p
                    LEFT JOIN keywords k ON p.target_keyword = k.term
                    WHERE p.id = :post_id
                """)
                
                result = session.execute(post_query, {'post_id': post_id})
                post_data = result.fetchone()
                
                if not post_data:
                    raise ValueError(f"Post not found: {post_id}")
                
                # Get SERP data for the target keyword
                serp_data = None
                if post_data.target_keyword:
                    serp_query = text("""
                        SELECT settings FROM keywords 
                        WHERE term = :keyword 
                        AND settings IS NOT NULL
                        ORDER BY updated_at DESC 
                        LIMIT 1
                    """)
                    
                    serp_result = session.execute(serp_query, {
                        'keyword': post_data.target_keyword
                    })
                    serp_row = serp_result.fetchone()
                    
                    if serp_row and serp_row[0]:
                        serp_data = json.loads(serp_row[0])
                
                return {
                    'post': {
                        'id': post_data[0],
                        'title': post_data[1],
                        'target_keyword': post_data.target_keyword,
                        'settings': json.loads(post_data[11]) if post_data[11] else {}
                    },
                    'serp_data': serp_data
                }
                
        except Exception as e:
            logger.error(f"Error fetching post data: {e}")
            raise
    
    def generate_outline_prompt(self, post_data: Dict[str, Any], target_word_count: int = 1500) -> str:
        """Generate the prompt for outline creation"""
        post = post_data['post']
        serp_data = post_data.get('serp_data', {})
        
        # Extract SERP insights
        serp_insights = ""
        if serp_data:
            titles = serp_data.get('titles', [])
            people_also_ask = serp_data.get('people_also_ask', [])
            related_searches = serp_data.get('related_searches', [])
            
            serp_insights = f"""
SERP Analysis:
- Top ranking titles: {', '.join(titles[:5])}
- People also ask: {', '.join(people_also_ask[:3])}
- Related searches: {', '.join(related_searches[:5])}
"""
        
        prompt = f"""
You are an expert content strategist and SEO specialist. Create a detailed content outline for a blog post about "{post['title']}".

Target keyword: {post['target_keyword']}
Target word count: {target_word_count:,} words
Tone: Professional but accessible
Audience: General audience interested in the topic

{serp_insights}

Requirements:
1. Create a logical H1-H3 structure that covers the topic comprehensively
2. Include the target keyword naturally in H1 and some H2 headings
3. Address common questions and pain points from SERP data
4. Ensure good content flow and logical progression
5. Provide estimated word count for each section
6. Include an introduction and conclusion

Format the response as a JSON array with this structure:
[
  {{
    "level": 1,
    "title": "H1 Title",
    "word_count": 150,
    "content": "Brief description of what this section will cover"
  }},
  {{
    "level": 2,
    "title": "H2 Subtitle",
    "word_count": 200,
    "content": "Brief description"
  }},
  {{
    "level": 3,
    "title": "H3 Sub-subtitle",
    "word_count": 100,
    "content": "Brief description"
  }}
]

Ensure the total word count is approximately {target_word_count:,} words.
"""
        
        return prompt
    
    async def generate_outline_with_openai(self, prompt: str) -> List[Dict[str, Any]]:
        """Generate outline using OpenAI API"""
        try:
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert content strategist and SEO specialist."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            # Extract JSON from response
            try:
                # Find JSON array in the response
                start_idx = content.find('[')
                end_idx = content.rfind(']') + 1
                
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx]
                    outline_data = json.loads(json_str)
                    return outline_data
                else:
                    raise ValueError("No JSON array found in response")
                    
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from OpenAI response: {e}")
                logger.error(f"Response content: {content}")
                raise
                
        except Exception as e:
            logger.error(f"Error generating outline with OpenAI: {e}")
            raise
    
    async def generate_outline_with_anthropic(self, prompt: str) -> List[Dict[str, Any]]:
        """Generate outline using Anthropic Claude API"""
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            
            response = await asyncio.to_thread(
                client.messages.create,
                model="claude-3-sonnet-20240229",
                max_tokens=2000,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.content[0].text
            
            # Extract JSON from response (similar to OpenAI)
            try:
                start_idx = content.find('[')
                end_idx = content.rfind(']') + 1
                
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx]
                    outline_data = json.loads(json_str)
                    return outline_data
                else:
                    raise ValueError("No JSON array found in response")
                    
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from Anthropic response: {e}")
                logger.error(f"Response content: {content}")
                raise
                
        except Exception as e:
            logger.error(f"Error generating outline with Anthropic: {e}")
            raise
    
    async def generate_outline(self, post_id: str, target_word_count: int = 1500) -> Outline:
        """Generate content outline for a post"""
        try:
            # Get post data
            post_data = await self.get_post_data(post_id)
            
            # Generate prompt
            prompt = self.generate_outline_prompt(post_data, target_word_count)
            
            # Generate outline using available AI service
            outline_data = None
            
            if self.openai_api_key:
                try:
                    outline_data = await self.generate_outline_with_openai(prompt)
                except Exception as e:
                    logger.warning(f"OpenAI failed, trying Anthropic: {e}")
            
            if not outline_data and self.anthropic_api_key:
                try:
                    outline_data = await self.generate_outline_with_anthropic(prompt)
                except Exception as e:
                    logger.error(f"Anthropic also failed: {e}")
            
            if not outline_data:
                raise Exception("Failed to generate outline with both OpenAI and Anthropic")
            
            # Convert to OutlineSection objects
            sections = []
            total_words = 0
            
            for section_data in outline_data:
                section = OutlineSection(
                    level=section_data.get('level', 1),
                    title=section_data.get('title', ''),
                    word_count=section_data.get('word_count', 0),
                    content=section_data.get('content', ''),
                    keywords=section_data.get('keywords', [])
                )
                sections.append(section)
                total_words += section.word_count
            
            # Create outline object
            outline = Outline(
                post_id=post_id,
                structure=sections,
                total_words=total_words,
                target_keyword=post_data['post']['target_keyword'] or '',
                tone='professional',
                audience='general'
            )
            
            return outline
            
        except Exception as e:
            logger.error(f"Error generating outline: {e}")
            raise
    
    async def save_outline(self, outline: Outline) -> str:
        """Save outline to database"""
        try:
            with self.SessionLocal() as session:
                # Convert outline to JSON
                outline_json = {
                    'structure': [
                        {
                            'level': section.level,
                            'title': section.title,
                            'word_count': section.word_count,
                            'content': section.content,
                            'keywords': section.keywords
                        }
                        for section in outline.structure
                    ],
                    'target_keyword': outline.target_keyword,
                    'tone': outline.tone,
                    'audience': outline.audience
                }
                
                # Insert or update outline
                outline_query = text("""
                    INSERT INTO outlines (post_id, structure, total_words, is_locked, created_at, updated_at)
                    VALUES (:post_id, :structure, :total_words, :is_locked, NOW(), NOW())
                    ON CONFLICT (post_id) DO UPDATE SET
                        structure = EXCLUDED.structure,
                        total_words = EXCLUDED.total_words,
                        is_locked = EXCLUDED.is_locked,
                        updated_at = NOW()
                    RETURNING id
                """)
                
                result = session.execute(outline_query, {
                    'post_id': outline.post_id,
                    'structure': json.dumps(outline_json),
                    'total_words': outline.total_words,
                    'is_locked': outline.is_locked
                })
                
                outline_id = result.fetchone()[0]
                
                # Update post status to 'outline'
                update_post_query = text("""
                    UPDATE posts 
                    SET status = 'outline', updated_at = NOW()
                    WHERE id = :post_id
                """)
                
                session.execute(update_post_query, {'post_id': outline.post_id})
                
                session.commit()
                logger.info(f"Saved outline for post: {outline.post_id}")
                return outline_id
                
        except Exception as e:
            logger.error(f"Error saving outline: {e}")
            raise
    
    async def process_outline_request(self, post_id: str, target_word_count: int = 1500) -> Dict[str, Any]:
        """Main method to process outline generation request"""
        try:
            # Generate outline
            outline = await self.generate_outline(post_id, target_word_count)
            
            # Save to database
            outline_id = await self.save_outline(outline)
            
            return {
                'outline_id': outline_id,
                'post_id': post_id,
                'structure': [
                    {
                        'level': section.level,
                        'title': section.title,
                        'word_count': section.word_count,
                        'content': section.content
                    }
                    for section in outline.structure
                ],
                'total_words': outline.total_words,
                'target_keyword': outline.target_keyword
            }
            
        except Exception as e:
            logger.error(f"Error processing outline request: {e}")
            raise

async def main():
    """Main function for testing the worker"""
    worker = OutlineWorker()
    
    # Test with a sample post ID
    test_post_id = "550e8400-e29b-41d4-a716-446655440000"  # Sample UUID
    
    try:
        result = await worker.process_outline_request(test_post_id, 1500)
        print(f"Generated outline: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
