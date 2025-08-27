#!/usr/bin/env python3
"""
Refresh Worker - Content refresh prompts (traffic drop detection)
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import openai
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

@dataclass
class TrafficDrop:
    post_id: str
    post_title: str
    current_traffic: int
    previous_traffic: int
    drop_percentage: float
    days_since_published: int
    last_updated: datetime
    severity: str  # 'low', 'medium', 'high', 'critical'

@dataclass
class RefreshPrompt:
    post_id: str
    prompt_type: str  # 'traffic_drop', 'content_aging', 'competitor_update'
    title: str
    description: str
    suggested_actions: List[str]
    priority: str  # 'low', 'medium', 'high', 'urgent'
    created_at: datetime
    status: str  # 'pending', 'in_progress', 'completed', 'dismissed'

@dataclass
class ContentAnalysis:
    post_id: str
    content_freshness_score: float
    keyword_relevance_score: float
    competitor_gap_score: float
    seo_opportunity_score: float
    overall_refresh_score: float
    analysis_date: datetime

class RefreshWorker:
    def __init__(self):
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'database': 'ai_blog_writer',
            'user': 'postgres',
            'password': 'postgres'
        }
        
        # OpenAI configuration
        openai.api_key = 'YOUR_OPENAI_API_KEY'
        
        # Sentence transformer for content analysis
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Thresholds for traffic drop detection
        self.thresholds = {
            'low_drop': 0.15,      # 15% drop
            'medium_drop': 0.30,   # 30% drop
            'high_drop': 0.50,     # 50% drop
            'critical_drop': 0.70, # 70% drop
            'min_traffic': 100,    # Minimum traffic to consider
            'days_threshold': 30,  # Days since published to consider for refresh
        }

    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    async def get_published_posts_with_analytics(self) -> List[Dict[str, Any]]:
        """Get published posts with their analytics data"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT 
                        p.id, p.title, p.content, p.target_keyword, p.meta_description,
                        p.created_at, p.updated_at, pub.url, pub.platform,
                        a.date, a.page_views, a.unique_visitors, a.clicks, a.impressions
                    FROM posts p
                    JOIN publishes pub ON p.id = pub.post_id
                    LEFT JOIN analytics a ON p.id = a.post_id
                    WHERE pub.status = 'published'
                    AND pub.url IS NOT NULL
                    ORDER BY p.created_at DESC
                """)
                posts = await cur.fetchall()
                return [dict(post) for post in posts]

    async def detect_traffic_drops(self) -> List[TrafficDrop]:
        """Detect posts with significant traffic drops"""
        posts = await self.get_published_posts_with_analytics()
        traffic_drops = []
        
        for post in posts:
            # Group analytics by date
            analytics_by_date = {}
            for date, page_views in zip(post.get('date', []), post.get('page_views', [])):
                if date and page_views:
                    analytics_by_date[date] = page_views
            
            if not analytics_by_date:
                continue
            
            # Calculate current vs previous period traffic
            sorted_dates = sorted(analytics_by_date.keys())
            if len(sorted_dates) < 14:  # Need at least 2 weeks of data
                continue
            
            # Current week (last 7 days)
            current_end = sorted_dates[-1]
            current_start = (datetime.strptime(current_end, '%Y-%m-%d') - timedelta(days=6)).strftime('%Y-%m-%d')
            
            # Previous week (7 days before current)
            prev_end = (datetime.strptime(current_start, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d')
            prev_start = (datetime.strptime(prev_end, '%Y-%m-%d') - timedelta(days=6)).strftime('%Y-%m-%d')
            
            # Calculate traffic for both periods
            current_traffic = sum(
                analytics_by_date.get(date, 0) 
                for date in sorted_dates 
                if current_start <= date <= current_end
            )
            
            previous_traffic = sum(
                analytics_by_date.get(date, 0) 
                for date in sorted_dates 
                if prev_start <= date <= prev_end
            )
            
            if previous_traffic < self.thresholds['min_traffic']:
                continue
            
            # Calculate drop percentage
            drop_percentage = (previous_traffic - current_traffic) / previous_traffic
            
            if drop_percentage > self.thresholds['low_drop']:
                # Determine severity
                if drop_percentage > self.thresholds['critical_drop']:
                    severity = 'critical'
                elif drop_percentage > self.thresholds['high_drop']:
                    severity = 'high'
                elif drop_percentage > self.thresholds['medium_drop']:
                    severity = 'medium'
                else:
                    severity = 'low'
                
                # Calculate days since published
                days_since_published = (datetime.now() - post['created_at']).days
                
                traffic_drop = TrafficDrop(
                    post_id=post['id'],
                    post_title=post['title'],
                    current_traffic=current_traffic,
                    previous_traffic=previous_traffic,
                    drop_percentage=drop_percentage,
                    days_since_published=days_since_published,
                    last_updated=post['updated_at'],
                    severity=severity
                )
                traffic_drops.append(traffic_drop)
        
        return traffic_drops

    async def analyze_content_freshness(self, post: Dict[str, Any]) -> ContentAnalysis:
        """Analyze content freshness and relevance"""
        try:
            # Get current date for comparison
            current_date = datetime.now()
            days_since_published = (current_date - post['created_at']).days
            days_since_updated = (current_date - post['updated_at']).days
            
            # Content freshness score (0-1, higher is fresher)
            content_freshness_score = max(0, 1 - (days_since_updated / 365))
            
            # Keyword relevance score (mock - would use SERP analysis)
            keyword_relevance_score = 0.7  # Mock score
            
            # Competitor gap score (mock - would analyze competitor content)
            competitor_gap_score = 0.6  # Mock score
            
            # SEO opportunity score (mock - would analyze SERP features)
            seo_opportunity_score = 0.8  # Mock score
            
            # Overall refresh score (weighted average)
            overall_refresh_score = (
                content_freshness_score * 0.3 +
                keyword_relevance_score * 0.25 +
                competitor_gap_score * 0.25 +
                seo_opportunity_score * 0.2
            )
            
            return ContentAnalysis(
                post_id=post['id'],
                content_freshness_score=content_freshness_score,
                keyword_relevance_score=keyword_relevance_score,
                competitor_gap_score=competitor_gap_score,
                seo_opportunity_score=seo_opportunity_score,
                overall_refresh_score=overall_refresh_score,
                analysis_date=current_date
            )
            
        except Exception as e:
            print(f"Error analyzing content freshness for post {post['id']}: {e}")
            return None

    async def generate_refresh_prompt(self, traffic_drop: TrafficDrop, content_analysis: ContentAnalysis) -> RefreshPrompt:
        """Generate a refresh prompt using AI"""
        try:
            # Prepare context for AI
            context = f"""
            Post Title: {traffic_drop.post_title}
            Traffic Drop: {traffic_drop.drop_percentage:.1%}
            Days Since Published: {traffic_drop.days_since_published}
            Current Traffic: {traffic_drop.current_traffic}
            Previous Traffic: {traffic_drop.previous_traffic}
            Content Freshness Score: {content_analysis.content_freshness_score:.2f}
            Overall Refresh Score: {content_analysis.overall_refresh_score:.2f}
            """
            
            # Generate prompt using OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a content marketing expert. Analyze the given post data and generate a refresh prompt with specific, actionable suggestions."
                    },
                    {
                        "role": "user",
                        "content": f"""
                        Analyze this post that has experienced a traffic drop and generate a refresh prompt:
                        
                        {context}
                        
                        Please provide:
                        1. A clear title for the refresh prompt
                        2. A description of why the content needs refreshing
                        3. 3-5 specific, actionable suggestions for improving the content
                        4. Priority level (low/medium/high/urgent) based on the traffic drop severity
                        
                        Format as JSON:
                        {{
                            "title": "string",
                            "description": "string",
                            "suggested_actions": ["action1", "action2", "action3"],
                            "priority": "low|medium|high|urgent"
                        }}
                        """
                    }
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Parse AI response
            ai_response = json.loads(response.choices[0].message.content)
            
            # Determine priority based on traffic drop severity
            priority_mapping = {
                'low': 'low',
                'medium': 'medium', 
                'high': 'high',
                'critical': 'urgent'
            }
            
            priority = priority_mapping.get(traffic_drop.severity, 'medium')
            
            return RefreshPrompt(
                post_id=traffic_drop.post_id,
                prompt_type='traffic_drop',
                title=ai_response['title'],
                description=ai_response['description'],
                suggested_actions=ai_response['suggested_actions'],
                priority=priority,
                created_at=datetime.now(),
                status='pending'
            )
            
        except Exception as e:
            print(f"Error generating refresh prompt for post {traffic_drop.post_id}: {e}")
            # Fallback prompt
            return RefreshPrompt(
                post_id=traffic_drop.post_id,
                prompt_type='traffic_drop',
                title=f"Content Refresh Needed: {traffic_drop.post_title}",
                description=f"This post has experienced a {traffic_drop.drop_percentage:.1%} traffic drop and may need refreshing.",
                suggested_actions=[
                    "Update statistics and data",
                    "Add recent examples and case studies",
                    "Improve SEO optimization",
                    "Add new sections or expand existing content",
                    "Update meta description and title"
                ],
                priority='medium',
                created_at=datetime.now(),
                status='pending'
            )

    async def save_refresh_prompt(self, prompt: RefreshPrompt):
        """Save refresh prompt to database"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO refresh_prompts (
                        post_id, prompt_type, title, description, suggested_actions,
                        priority, status, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    prompt.post_id,
                    prompt.prompt_type,
                    prompt.title,
                    prompt.description,
                    json.dumps(prompt.suggested_actions),
                    prompt.priority,
                    prompt.status,
                    prompt.created_at,
                    datetime.now()
                ))
                
                await conn.commit()

    async def save_content_analysis(self, analysis: ContentAnalysis):
        """Save content analysis to database"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO content_analyses (
                        post_id, content_freshness_score, keyword_relevance_score,
                        competitor_gap_score, seo_opportunity_score, overall_refresh_score,
                        analysis_date, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) ON CONFLICT (post_id) 
                    DO UPDATE SET 
                        content_freshness_score = EXCLUDED.content_freshness_score,
                        keyword_relevance_score = EXCLUDED.keyword_relevance_score,
                        competitor_gap_score = EXCLUDED.competitor_gap_score,
                        seo_opportunity_score = EXCLUDED.seo_opportunity_score,
                        overall_refresh_score = EXCLUDED.overall_refresh_score,
                        analysis_date = EXCLUDED.analysis_date,
                        updated_at = EXCLUDED.updated_at
                """, (
                    analysis.post_id,
                    analysis.content_freshness_score,
                    analysis.keyword_relevance_score,
                    analysis.competitor_gap_score,
                    analysis.seo_opportunity_score,
                    analysis.overall_refresh_score,
                    analysis.analysis_date,
                    datetime.now(),
                    datetime.now()
                ))
                
                await conn.commit()

    async def run_refresh_analysis(self) -> List[RefreshPrompt]:
        """Main function to run refresh analysis"""
        try:
            print("Starting refresh analysis...")
            
            # Detect traffic drops
            traffic_drops = await self.detect_traffic_drops()
            print(f"Detected {len(traffic_drops)} traffic drops")
            
            # Get posts for analysis
            posts = await self.get_published_posts_with_analytics()
            posts_dict = {post['id']: post for post in posts}
            
            refresh_prompts = []
            
            # Analyze each traffic drop
            for traffic_drop in traffic_drops:
                if traffic_drop.post_id in posts_dict:
                    post = posts_dict[traffic_drop.post_id]
                    
                    # Analyze content freshness
                    content_analysis = await self.analyze_content_freshness(post)
                    if content_analysis:
                        await self.save_content_analysis(content_analysis)
                    
                    # Generate refresh prompt
                    refresh_prompt = await self.generate_refresh_prompt(traffic_drop, content_analysis)
                    await self.save_refresh_prompt(refresh_prompt)
                    refresh_prompts.append(refresh_prompt)
                    
                    print(f"Generated refresh prompt for post: {traffic_drop.post_title}")
            
            print(f"Generated {len(refresh_prompts)} refresh prompts")
            return refresh_prompts
            
        except Exception as e:
            print(f"Error in refresh analysis: {e}")
            return []

    async def process_refresh_request(self) -> Dict[str, Any]:
        """Main processing function for refresh analysis requests"""
        try:
            refresh_prompts = await self.run_refresh_analysis()
            
            return {
                'success': True,
                'message': f'Refresh analysis completed. Generated {len(refresh_prompts)} prompts.',
                'prompts_count': len(refresh_prompts),
                'prompts': [
                    {
                        'post_id': prompt.post_id,
                        'title': prompt.title,
                        'priority': prompt.priority,
                        'type': prompt.prompt_type
                    }
                    for prompt in refresh_prompts
                ],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

async def main():
    """Test the refresh worker"""
    worker = RefreshWorker()
    
    # Test refresh analysis
    result = await worker.process_refresh_request()
    print("Refresh Analysis Result:")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
