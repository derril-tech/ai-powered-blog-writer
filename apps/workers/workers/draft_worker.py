# Created automatically by Cursor AI (2024-01-27)

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import re

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
class Citation:
    """Represents a citation in the content"""
    text: str
    source_url: str
    source_title: str
    position: int

@dataclass
class Draft:
    """Complete content draft"""
    post_id: str
    content: str
    word_count: int
    version: int
    citations: List[Citation]
    tone: str
    audience: str
    is_current: bool = True

class DraftWorker:
    """Worker for generating content drafts using LLM+RAG"""
    
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
    
    async def get_post_and_outline_data(self, post_id: str) -> Dict[str, Any]:
        """Fetch post data and outline from database"""
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
                
                # Get outline data
                outline_query = text("""
                    SELECT structure, total_words, is_locked
                    FROM outlines
                    WHERE post_id = :post_id
                    ORDER BY updated_at DESC
                    LIMIT 1
                """)
                
                outline_result = session.execute(outline_query, {'post_id': post_id})
                outline_data = outline_result.fetchone()
                
                if not outline_data:
                    raise ValueError(f"No outline found for post: {post_id}")
                
                # Get SERP data for research
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
                    'outline': {
                        'structure': json.loads(outline_data[0]) if outline_data[0] else {},
                        'total_words': outline_data[1],
                        'is_locked': outline_data[2]
                    },
                    'serp_data': serp_data
                }
                
        except Exception as e:
            logger.error(f"Error fetching post and outline data: {e}")
            raise
    
    def extract_research_sources(self, serp_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract research sources from SERP data"""
        sources = []
        
        if not serp_data:
            return sources
        
        # Extract from organic results
        urls = serp_data.get('urls', [])
        titles = serp_data.get('titles', [])
        descriptions = serp_data.get('descriptions', [])
        
        for i, url in enumerate(urls):
            if i < len(titles) and i < len(descriptions):
                sources.append({
                    'url': url,
                    'title': titles[i],
                    'description': descriptions[i]
                })
        
        # Extract from featured snippets
        featured_snippets = serp_data.get('featured_snippets', [])
        for snippet in featured_snippets:
            if snippet.get('link'):
                sources.append({
                    'url': snippet['link'],
                    'title': snippet.get('title', 'Featured Snippet'),
                    'description': snippet.get('snippet', '')
                })
        
        return sources[:10]  # Limit to top 10 sources
    
    def generate_draft_prompt(self, post_data: Dict[str, Any], sources: List[Dict[str, str]], tone: str = 'professional', audience: str = 'general') -> str:
        """Generate the prompt for draft creation"""
        post = post_data['post']
        outline = post_data['outline']
        structure = outline['structure']
        
        # Format outline structure
        outline_text = ""
        for section in structure.get('structure', []):
            indent = "  " * (section.get('level', 1) - 1)
            outline_text += f"{indent}{section.get('title', '')} ({section.get('word_count', 0)} words)\n"
            if section.get('content'):
                outline_text += f"{indent}  {section.get('content', '')}\n"
        
        # Format research sources
        sources_text = ""
        for i, source in enumerate(sources, 1):
            sources_text += f"{i}. {source['title']}\n   URL: {source['url']}\n   {source['description']}\n\n"
        
        prompt = f"""
You are an expert content writer and SEO specialist. Write a comprehensive blog post based on the provided outline and research sources.

Post Title: {post['title']}
Target Keyword: {post['target_keyword']}
Target Word Count: {outline['total_words']:,} words
Tone: {tone}
Audience: {audience}

OUTLINE:
{outline_text}

RESEARCH SOURCES:
{sources_text}

Requirements:
1. Follow the outline structure exactly, including all headings and word counts
2. Write engaging, informative content that provides real value
3. Naturally incorporate the target keyword throughout the content
4. Include relevant citations from the research sources using [1], [2], etc.
5. Maintain the specified tone and target the specified audience
6. Ensure the content flows logically and is well-structured
7. Include a compelling introduction and conclusion
8. Make the content scannable with proper formatting

Format the response as markdown with proper headings, paragraphs, and citations.
Do not include any meta information or explanations - just the content.
"""
        
        return prompt
    
    async def generate_draft_with_openai(self, prompt: str) -> str:
        """Generate draft using OpenAI API"""
        try:
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert content writer and SEO specialist."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content
            return content
                
        except Exception as e:
            logger.error(f"Error generating draft with OpenAI: {e}")
            raise
    
    async def generate_draft_with_anthropic(self, prompt: str) -> str:
        """Generate draft using Anthropic Claude API"""
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            
            response = await asyncio.to_thread(
                client.messages.create,
                model="claude-3-sonnet-20240229",
                max_tokens=4000,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.content[0].text
            return content
                
        except Exception as e:
            logger.error(f"Error generating draft with Anthropic: {e}")
            raise
    
    def extract_citations(self, content: str, sources: List[Dict[str, str]]) -> List[Citation]:
        """Extract citations from the generated content"""
        citations = []
        
        # Find citation patterns like [1], [2], etc.
        citation_pattern = r'\[(\d+)\]'
        matches = re.finditer(citation_pattern, content)
        
        for match in matches:
            citation_num = int(match.group(1))
            if 1 <= citation_num <= len(sources):
                source = sources[citation_num - 1]
                citation = Citation(
                    text=match.group(0),
                    source_url=source['url'],
                    source_title=source['title'],
                    position=match.start()
                )
                citations.append(citation)
        
        return citations
    
    def count_words(self, text: str) -> int:
        """Count words in text"""
        return len(text.split())
    
    async def generate_draft(self, post_id: str, tone: str = 'professional', audience: str = 'general') -> Draft:
        """Generate content draft for a post"""
        try:
            # Get post and outline data
            post_data = await self.get_post_and_outline_data(post_id)
            
            # Extract research sources
            sources = self.extract_research_sources(post_data.get('serp_data', {}))
            
            # Generate prompt
            prompt = self.generate_draft_prompt(post_data, sources, tone, audience)
            
            # Generate draft using available AI service
            content = None
            
            if self.openai_api_key:
                try:
                    content = await self.generate_draft_with_openai(prompt)
                except Exception as e:
                    logger.warning(f"OpenAI failed, trying Anthropic: {e}")
            
            if not content and self.anthropic_api_key:
                try:
                    content = await self.generate_draft_with_anthropic(prompt)
                except Exception as e:
                    logger.error(f"Anthropic also failed: {e}")
            
            if not content:
                raise Exception("Failed to generate draft with both OpenAI and Anthropic")
            
            # Extract citations
            citations = self.extract_citations(content, sources)
            
            # Count words
            word_count = self.count_words(content)
            
            # Create draft object
            draft = Draft(
                post_id=post_id,
                content=content,
                word_count=word_count,
                version=1,
                citations=citations,
                tone=tone,
                audience=audience
            )
            
            return draft
            
        except Exception as e:
            logger.error(f"Error generating draft: {e}")
            raise
    
    async def save_draft(self, draft: Draft) -> str:
        """Save draft to database"""
        try:
            with self.SessionLocal() as session:
                # Mark existing drafts as not current
                update_query = text("""
                    UPDATE drafts 
                    SET is_current = false, updated_at = NOW()
                    WHERE post_id = :post_id
                """)
                
                session.execute(update_query, {'post_id': draft.post_id})
                
                # Insert new draft
                draft_query = text("""
                    INSERT INTO drafts (post_id, content, word_count, version, is_current, created_at, updated_at)
                    VALUES (:post_id, :content, :word_count, :version, :is_current, NOW(), NOW())
                    RETURNING id
                """)
                
                # Get next version number
                version_query = text("""
                    SELECT COALESCE(MAX(version), 0) + 1
                    FROM drafts
                    WHERE post_id = :post_id
                """)
                
                version_result = session.execute(version_query, {'post_id': draft.post_id})
                next_version = version_result.fetchone()[0]
                
                result = session.execute(draft_query, {
                    'post_id': draft.post_id,
                    'content': draft.content,
                    'word_count': draft.word_count,
                    'version': next_version,
                    'is_current': draft.is_current
                })
                
                draft_id = result.fetchone()[0]
                
                # Update post status and word count
                update_post_query = text("""
                    UPDATE posts 
                    SET status = 'writing', word_count = :word_count, updated_at = NOW()
                    WHERE id = :post_id
                """)
                
                session.execute(update_post_query, {
                    'post_id': draft.post_id,
                    'word_count': draft.word_count
                })
                
                session.commit()
                logger.info(f"Saved draft for post: {draft.post_id}")
                return draft_id
                
        except Exception as e:
            logger.error(f"Error saving draft: {e}")
            raise
    
    async def process_draft_request(self, post_id: str, tone: str = 'professional', audience: str = 'general') -> Dict[str, Any]:
        """Main method to process draft generation request"""
        try:
            # Generate draft
            draft = await self.generate_draft(post_id, tone, audience)
            
            # Save to database
            draft_id = await self.save_draft(draft)
            
            return {
                'draft_id': draft_id,
                'post_id': post_id,
                'content': draft.content,
                'word_count': draft.word_count,
                'version': draft.version,
                'citations': [
                    {
                        'text': citation.text,
                        'source_url': citation.source_url,
                        'source_title': citation.source_title
                    }
                    for citation in draft.citations
                ],
                'tone': draft.tone,
                'audience': draft.audience
            }
            
        except Exception as e:
            logger.error(f"Error processing draft request: {e}")
            raise

async def main():
    """Main function for testing the worker"""
    worker = DraftWorker()
    
    # Test with a sample post ID
    test_post_id = "550e8400-e29b-41d4-a716-446655440000"  # Sample UUID
    
    try:
        result = await worker.process_draft_request(test_post_id, 'professional', 'general')
        print(f"Generated draft: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
