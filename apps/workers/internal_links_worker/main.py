#!/usr/bin/env python3
"""
Internal Links Worker - Suggests relevant internal links based on sitemap and content analysis
"""

import asyncio
import json
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

@dataclass
class InternalLink:
    url: str
    title: str
    description: str
    relevance_score: float
    anchor_text_suggestions: List[str]
    link_type: str  # 'related', 'supporting', 'authoritative'

@dataclass
class LinkSuggestion:
    post_id: str
    suggested_links: List[InternalLink]
    created_at: datetime
    updated_at: datetime

class InternalLinksWorker:
    def __init__(self):
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'database': 'ai_blog_writer',
            'user': 'postgres',
            'password': 'postgres'
        }
        
        # Initialize sentence transformer for semantic similarity
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Link suggestion thresholds
        self.thresholds = {
            'min_relevance_score': 0.3,
            'max_links_per_type': 5,
            'min_content_length': 100
        }

    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    async def get_post_data(self, post_id: str) -> Dict[str, Any]:
        """Fetch post data including content and metadata"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT p.*, d.content, d.citations
                    FROM posts p
                    LEFT JOIN drafts d ON p.id = d.post_id
                    WHERE p.id = %s
                """, (post_id,))
                post_data = await cur.fetchone()
                
                if not post_data:
                    raise ValueError(f"Post {post_id} not found")
                
                return dict(post_data)

    async def get_site_posts(self, org_id: str, exclude_post_id: str = None) -> List[Dict[str, Any]]:
        """Fetch all published posts from the site for link suggestions"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT p.id, p.title, p.slug, p.meta_description, p.target_keyword,
                           d.content, p.created_at, p.updated_at
                    FROM posts p
                    LEFT JOIN drafts d ON p.id = d.post_id
                    WHERE p.org_id = %s AND p.status = 'published'
                """
                params = [org_id]
                
                if exclude_post_id:
                    query += " AND p.id != %s"
                    params.append(exclude_post_id)
                
                query += " ORDER BY p.updated_at DESC"
                
                await cur.execute(query, params)
                posts = await cur.fetchall()
                
                return [dict(post) for post in posts]

    async def fetch_sitemap(self, site_url: str) -> List[Dict[str, str]]:
        """Fetch and parse sitemap.xml for additional URLs"""
        try:
            sitemap_url = urljoin(site_url, '/sitemap.xml')
            response = requests.get(sitemap_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'xml')
            urls = []
            
            for url in soup.find_all('url'):
                loc = url.find('loc')
                lastmod = url.find('lastmod')
                priority = url.find('priority')
                
                if loc:
                    urls.append({
                        'url': loc.text,
                        'lastmod': lastmod.text if lastmod else None,
                        'priority': float(priority.text) if priority else 0.5
                    })
            
            return urls
        except Exception as e:
            print(f"Error fetching sitemap: {e}")
            return []

    def extract_content_features(self, content: str) -> Dict[str, Any]:
        """Extract key features from content for similarity analysis"""
        if not content:
            return {'keywords': [], 'topics': [], 'entities': []}
        
        # Clean content
        soup = BeautifulSoup(content, 'html.parser')
        text_content = soup.get_text()
        
        # Extract keywords (simple approach)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text_content.lower())
        word_freq = {}
        for word in words:
            if word not in ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top keywords
        keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Extract topics (simple categorization)
        topics = []
        topic_keywords = {
            'technology': ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'data', 'algorithm'],
            'marketing': ['seo', 'marketing', 'content', 'strategy', 'campaign', 'brand', 'audience'],
            'business': ['business', 'strategy', 'growth', 'revenue', 'profit', 'market', 'industry'],
            'productivity': ['productivity', 'efficiency', 'workflow', 'automation', 'tools', 'process']
        }
        
        for topic, topic_words in topic_keywords.items():
            if any(word in text_content.lower() for word in topic_words):
                topics.append(topic)
        
        # Extract entities (simple approach)
        entities = []
        # Look for capitalized phrases that might be entities
        entity_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
        potential_entities = re.findall(entity_pattern, text_content)
        entities = list(set(potential_entities))[:5]
        
        return {
            'keywords': [kw[0] for kw in keywords],
            'topics': topics,
            'entities': entities,
            'text_length': len(text_content)
        }

    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts"""
        try:
            # Clean texts
            soup1 = BeautifulSoup(text1, 'html.parser')
            soup2 = BeautifulSoup(text2, 'html.parser')
            
            clean_text1 = soup1.get_text()[:1000]  # Limit length for performance
            clean_text2 = soup2.get_text()[:1000]
            
            if not clean_text1.strip() or not clean_text2.strip():
                return 0.0
            
            # Get embeddings
            embeddings = self.model.encode([clean_text1, clean_text2])
            
            # Calculate cosine similarity
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            
            return float(similarity)
        except Exception as e:
            print(f"Error calculating semantic similarity: {e}")
            return 0.0

    def calculate_keyword_overlap(self, keywords1: List[str], keywords2: List[str]) -> float:
        """Calculate keyword overlap between two sets of keywords"""
        if not keywords1 or not keywords2:
            return 0.0
        
        set1 = set(keywords1)
        set2 = set(keywords2)
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        return intersection / union if union > 0 else 0.0

    def generate_anchor_text_suggestions(self, source_title: str, target_title: str, target_keyword: str = None) -> List[str]:
        """Generate anchor text suggestions for internal links"""
        suggestions = []
        
        # Use target keyword if available
        if target_keyword:
            suggestions.append(target_keyword)
        
        # Use target title (shortened)
        title_words = target_title.split()[:4]
        suggestions.append(' '.join(title_words))
        
        # Generate contextual suggestions
        contextual_phrases = [
            'learn more about',
            'read our guide on',
            'discover',
            'explore',
            'find out more about',
            'get the full story on',
            'dive deeper into'
        ]
        
        for phrase in contextual_phrases:
            suggestions.append(f"{phrase} {target_title.lower()}")
        
        # Use action words
        action_words = ['guide', 'tips', 'strategies', 'best practices', 'examples']
        for action in action_words:
            if action.lower() in target_title.lower():
                suggestions.append(f"{action} for {target_title.lower()}")
        
        return list(set(suggestions))[:5]  # Remove duplicates and limit

    def determine_link_type(self, relevance_score: float, keyword_overlap: float, semantic_similarity: float) -> str:
        """Determine the type of internal link based on relevance metrics"""
        if relevance_score > 0.8 and keyword_overlap > 0.5:
            return 'related'
        elif semantic_similarity > 0.6:
            return 'supporting'
        else:
            return 'authoritative'

    async def analyze_internal_links(self, post_id: str) -> List[InternalLink]:
        """Analyze and suggest internal links for a post"""
        # Get source post data
        post_data = await self.get_post_data(post_id)
        source_features = self.extract_content_features(post_data.get('content', ''))
        
        # Get potential target posts
        target_posts = await self.get_site_posts(post_data['org_id'], post_id)
        
        if not target_posts:
            return []
        
        # Calculate similarities and scores
        link_suggestions = []
        
        for target_post in target_posts:
            target_features = self.extract_content_features(target_post.get('content', ''))
            
            # Calculate various similarity metrics
            semantic_similarity = self.calculate_semantic_similarity(
                post_data.get('content', ''),
                target_post.get('content', '')
            )
            
            keyword_overlap = self.calculate_keyword_overlap(
                source_features['keywords'],
                target_features['keywords']
            )
            
            # Calculate overall relevance score
            relevance_score = (
                semantic_similarity * 0.4 +
                keyword_overlap * 0.3 +
                (1.0 if any(topic in target_features['topics'] for topic in source_features['topics']) else 0.0) * 0.2 +
                (1.0 if target_post.get('target_keyword') == post_data.get('target_keyword') else 0.0) * 0.1
            )
            
            # Filter by minimum relevance
            if relevance_score >= self.thresholds['min_relevance_score']:
                link_type = self.determine_link_type(relevance_score, keyword_overlap, semantic_similarity)
                
                anchor_texts = self.generate_anchor_text_suggestions(
                    post_data.get('title', ''),
                    target_post.get('title', ''),
                    target_post.get('target_keyword')
                )
                
                link_suggestion = InternalLink(
                    url=f"/{target_post['slug']}",
                    title=target_post.get('title', ''),
                    description=target_post.get('meta_description', ''),
                    relevance_score=relevance_score,
                    anchor_text_suggestions=anchor_texts,
                    link_type=link_type
                )
                
                link_suggestions.append(link_suggestion)
        
        # Sort by relevance score and limit results
        link_suggestions.sort(key=lambda x: x.relevance_score, reverse=True)
        
        # Limit by type
        related_links = [link for link in link_suggestions if link.link_type == 'related'][:self.thresholds['max_links_per_type']]
        supporting_links = [link for link in link_suggestions if link.link_type == 'supporting'][:self.thresholds['max_links_per_type']]
        authoritative_links = [link for link in link_suggestions if link.link_type == 'authoritative'][:self.thresholds['max_links_per_type']]
        
        return related_links + supporting_links + authoritative_links

    async def suggest_link_placements(self, content: str, suggested_links: List[InternalLink]) -> List[Dict[str, Any]]:
        """Suggest where to place internal links in the content"""
        if not content or not suggested_links:
            return []
        
        soup = BeautifulSoup(content, 'html.parser')
        paragraphs = soup.find_all(['p', 'h2', 'h3'])
        
        placements = []
        
        for link in suggested_links[:3]:  # Limit to top 3 suggestions
            best_paragraph = None
            best_score = 0
            
            for i, paragraph in enumerate(paragraphs):
                if not paragraph.get_text().strip():
                    continue
                
                # Calculate relevance to this paragraph
                paragraph_text = paragraph.get_text()
                relevance = self.calculate_semantic_similarity(paragraph_text, link.title)
                
                # Prefer paragraphs that don't already have links
                existing_links = paragraph.find_all('a')
                if existing_links:
                    relevance *= 0.5  # Reduce score if paragraph already has links
                
                # Prefer paragraphs in the middle of the content
                position_score = 1.0 - abs(i - len(paragraphs) / 2) / len(paragraphs)
                relevance *= (0.7 + 0.3 * position_score)
                
                if relevance > best_score:
                    best_score = relevance
                    best_paragraph = paragraph
            
            if best_paragraph and best_score > 0.3:
                placements.append({
                    'link': link,
                    'paragraph_index': paragraphs.index(best_paragraph),
                    'paragraph_text': best_paragraph.get_text()[:100] + '...',
                    'suggested_anchor': link.anchor_text_suggestions[0] if link.anchor_text_suggestions else link.title,
                    'relevance_score': best_score
                })
        
        return placements

    async def save_link_suggestions(self, post_id: str, suggestions: List[InternalLink], placements: List[Dict[str, Any]]):
        """Save link suggestions to database"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor() as cur:
                # Save main suggestions
                await cur.execute("""
                    INSERT INTO internal_links (post_id, suggested_url, title, description, relevance_score, anchor_texts, link_type, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (post_id, suggested_url) 
                    DO UPDATE SET 
                        relevance_score = EXCLUDED.relevance_score,
                        anchor_texts = EXCLUDED.anchor_texts,
                        updated_at = EXCLUDED.updated_at
                """, (
                    post_id,
                    json.dumps([{
                        'url': link.url,
                        'title': link.title,
                        'description': link.description,
                        'relevance_score': link.relevance_score,
                        'anchor_text_suggestions': link.anchor_text_suggestions,
                        'link_type': link.link_type
                    } for link in suggestions]),
                    'Internal Link Suggestions',
                    f"Found {len(suggestions)} relevant internal links",
                    sum(link.relevance_score for link in suggestions) / len(suggestions) if suggestions else 0,
                    json.dumps([link.anchor_text_suggestions for link in suggestions]),
                    'suggested',
                    datetime.now(),
                    datetime.now()
                ))
                
                # Save placement suggestions
                if placements:
                    await cur.execute("""
                        INSERT INTO qa_checks (post_id, check_type, status, score, message, data, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (post_id, check_type) 
                        DO UPDATE SET 
                            data = EXCLUDED.data,
                            updated_at = EXCLUDED.updated_at
                    """, (
                        post_id,
                        'link_placements',
                        'info',
                        100,
                        f"Suggested {len(placements)} link placements",
                        json.dumps(placements),
                        datetime.now(),
                        datetime.now()
                    ))
                
                await conn.commit()

    async def process_internal_links_request(self, post_id: str) -> Dict[str, Any]:
        """Main processing function for internal link suggestions"""
        try:
            # Get link suggestions
            suggestions = await self.analyze_internal_links(post_id)
            
            # Get post content for placement suggestions
            post_data = await self.get_post_data(post_id)
            placements = await self.suggest_link_placements(post_data.get('content', ''), suggestions)
            
            # Save to database
            await self.save_link_suggestions(post_id, suggestions, placements)
            
            return {
                'success': True,
                'post_id': post_id,
                'suggestions': [
                    {
                        'url': link.url,
                        'title': link.title,
                        'description': link.description,
                        'relevance_score': link.relevance_score,
                        'anchor_text_suggestions': link.anchor_text_suggestions,
                        'link_type': link.link_type
                    }
                    for link in suggestions
                ],
                'placements': placements,
                'summary': {
                    'total_suggestions': len(suggestions),
                    'related_links': len([s for s in suggestions if s.link_type == 'related']),
                    'supporting_links': len([s for s in suggestions if s.link_type == 'supporting']),
                    'authoritative_links': len([s for s in suggestions if s.link_type == 'authoritative']),
                    'placement_suggestions': len(placements)
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'post_id': post_id
            }

async def main():
    """Test the internal links worker"""
    worker = InternalLinksWorker()
    
    # Test with a sample post ID
    post_id = "test-post-123"
    result = await worker.process_internal_links_request(post_id)
    
    print("Internal Links Analysis Result:")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
