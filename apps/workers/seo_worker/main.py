#!/usr/bin/env python3
"""
SEO Worker - On-page SEO analysis and optimization
"""

import asyncio
import re
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import openai
from bs4 import BeautifulSoup
import readability
from textstat import textstat
import yaml

@dataclass
class SEOCheck:
    check_type: str
    status: str  # 'pass', 'warning', 'fail'
    score: float
    message: str
    suggestions: List[str]
    data: Dict[str, Any]

@dataclass
class SEOAnalysis:
    post_id: str
    overall_score: float
    checks: List[SEOCheck]
    created_at: datetime
    updated_at: datetime

class SEOWorker:
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
        
        # SEO thresholds
        self.thresholds = {
            'title_length': {'min': 30, 'max': 60},
            'meta_length': {'min': 120, 'max': 160},
            'heading_structure': {'min_h1': 1, 'max_h1': 1},
            'readability': {'min_flesch': 60, 'min_grade': 8},
            'word_count': {'min': 300, 'target': 1500},
            'keyword_density': {'min': 0.5, 'max': 2.5},
            'internal_links': {'min': 2},
            'external_links': {'min': 1, 'max': 10}
        }

    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    async def get_post_data(self, post_id: str) -> Dict[str, Any]:
        """Fetch post data including content and metadata"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get post data
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

    def analyze_title(self, title: str, target_keyword: str) -> SEOCheck:
        """Analyze post title for SEO"""
        suggestions = []
        score = 100.0
        
        # Length check
        title_length = len(title)
        if title_length < self.thresholds['title_length']['min']:
            score -= 20
            suggestions.append(f"Title too short ({title_length} chars). Aim for 30-60 characters.")
        elif title_length > self.thresholds['title_length']['max']:
            score -= 15
            suggestions.append(f"Title too long ({title_length} chars). Aim for 30-60 characters.")
        
        # Keyword presence
        if target_keyword and target_keyword.lower() not in title.lower():
            score -= 25
            suggestions.append(f"Target keyword '{target_keyword}' not found in title")
        
        # Brand presence (optional)
        if not any(brand in title.lower() for brand in ['ai', 'blog', 'writer']):
            suggestions.append("Consider including brand terms in title")
        
        # Emotional triggers
        emotional_words = ['best', 'ultimate', 'complete', 'guide', 'tips', 'secrets']
        if not any(word in title.lower() for word in emotional_words):
            suggestions.append("Consider adding emotional trigger words")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='title',
            status=status,
            score=score,
            message=f"Title analysis: {title_length} characters",
            suggestions=suggestions,
            data={'length': title_length, 'keyword_present': target_keyword.lower() in title.lower() if target_keyword else None}
        )

    def analyze_meta_description(self, meta_desc: str, target_keyword: str) -> SEOCheck:
        """Analyze meta description for SEO"""
        suggestions = []
        score = 100.0
        
        if not meta_desc:
            return SEOCheck(
                check_type='meta_description',
                status='fail',
                score=0,
                message="No meta description found",
                suggestions=["Add a compelling meta description"],
                data={'length': 0}
            )
        
        # Length check
        meta_length = len(meta_desc)
        if meta_length < self.thresholds['meta_length']['min']:
            score -= 20
            suggestions.append(f"Meta description too short ({meta_length} chars). Aim for 120-160 characters.")
        elif meta_length > self.thresholds['meta_length']['max']:
            score -= 15
            suggestions.append(f"Meta description too long ({meta_length} chars). Aim for 120-160 characters.")
        
        # Keyword presence
        if target_keyword and target_keyword.lower() not in meta_desc.lower():
            score -= 25
            suggestions.append(f"Target keyword '{target_keyword}' not found in meta description")
        
        # Call to action
        cta_words = ['learn', 'discover', 'find', 'get', 'read', 'explore']
        if not any(word in meta_desc.lower() for word in cta_words):
            suggestions.append("Consider adding a call-to-action")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='meta_description',
            status=status,
            score=score,
            message=f"Meta description: {meta_length} characters",
            suggestions=suggestions,
            data={'length': meta_length, 'keyword_present': target_keyword.lower() in meta_desc.lower() if target_keyword else None}
        )

    def analyze_slug(self, slug: str, target_keyword: str) -> SEOCheck:
        """Analyze URL slug for SEO"""
        suggestions = []
        score = 100.0
        
        # Length check
        slug_length = len(slug)
        if slug_length > 60:
            score -= 20
            suggestions.append(f"Slug too long ({slug_length} chars). Keep under 60 characters.")
        
        # Keyword presence
        if target_keyword:
            keyword_slug = target_keyword.lower().replace(' ', '-')
            if keyword_slug not in slug:
                score -= 30
                suggestions.append(f"Target keyword not found in slug. Consider: {keyword_slug}")
        
        # Format check
        if not re.match(r'^[a-z0-9-]+$', slug):
            score -= 15
            suggestions.append("Slug contains invalid characters. Use only lowercase letters, numbers, and hyphens.")
        
        # Hyphen usage
        if slug.count('-') > 5:
            score -= 10
            suggestions.append("Too many hyphens in slug. Keep it concise.")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='slug',
            status=status,
            score=score,
            message=f"Slug analysis: {slug_length} characters",
            suggestions=suggestions,
            data={'length': slug_length, 'hyphen_count': slug.count('-')}
        )

    def analyze_heading_structure(self, content: str) -> SEOCheck:
        """Analyze heading structure (H1, H2, H3)"""
        suggestions = []
        score = 100.0
        
        # Parse content to find headings
        soup = BeautifulSoup(content, 'html.parser')
        h1_count = len(soup.find_all('h1'))
        h2_count = len(soup.find_all('h2'))
        h3_count = len(soup.find_all('h3'))
        
        # H1 check
        if h1_count == 0:
            score -= 30
            suggestions.append("No H1 heading found. Add a main heading.")
        elif h1_count > 1:
            score -= 20
            suggestions.append(f"Multiple H1 headings found ({h1_count}). Use only one H1 per page.")
        
        # H2 check
        if h2_count == 0:
            score -= 15
            suggestions.append("No H2 headings found. Add subheadings to structure content.")
        
        # Heading hierarchy
        if h3_count > 0 and h2_count == 0:
            score -= 10
            suggestions.append("H3 headings found without H2 headings. Maintain proper hierarchy.")
        
        # Heading distribution
        total_headings = h1_count + h2_count + h3_count
        if total_headings < 3:
            suggestions.append("Consider adding more headings to improve content structure.")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='heading_structure',
            status=status,
            score=score,
            message=f"Heading structure: H1={h1_count}, H2={h2_count}, H3={h3_count}",
            suggestions=suggestions,
            data={'h1_count': h1_count, 'h2_count': h2_count, 'h3_count': h3_count, 'total': total_headings}
        )

    def analyze_readability(self, content: str) -> SEOCheck:
        """Analyze content readability"""
        suggestions = []
        score = 100.0
        
        # Clean content for analysis
        soup = BeautifulSoup(content, 'html.parser')
        text_content = soup.get_text()
        
        # Flesch Reading Ease
        flesch_score = textstat.flesch_reading_ease(text_content)
        if flesch_score < self.thresholds['readability']['min_flesch']:
            score -= 20
            suggestions.append(f"Content is too complex (Flesch score: {flesch_score:.1f}). Aim for 60+ for better readability.")
        
        # Grade level
        grade_level = textstat.flesch_kincaid_grade(text_content)
        if grade_level > self.thresholds['readability']['min_grade']:
            score -= 15
            suggestions.append(f"Content is too advanced (Grade level: {grade_level:.1f}). Aim for 8th grade or lower.")
        
        # Sentence length
        sentences = textstat.sentence_count(text_content)
        words = textstat.lexicon_count(text_content)
        avg_sentence_length = words / sentences if sentences > 0 else 0
        
        if avg_sentence_length > 20:
            score -= 10
            suggestions.append(f"Average sentence length is {avg_sentence_length:.1f} words. Aim for 15-20 words.")
        
        # Paragraph length
        paragraphs = text_content.split('\n\n')
        long_paragraphs = sum(1 for p in paragraphs if len(p.split()) > 150)
        if long_paragraphs > 0:
            suggestions.append(f"Found {long_paragraphs} long paragraphs. Break them up for better readability.")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='readability',
            status=status,
            score=score,
            message=f"Readability: Flesch {flesch_score:.1f}, Grade {grade_level:.1f}",
            suggestions=suggestions,
            data={'flesch_score': flesch_score, 'grade_level': grade_level, 'avg_sentence_length': avg_sentence_length}
        )

    def analyze_keyword_density(self, content: str, target_keyword: str) -> SEOCheck:
        """Analyze keyword density and usage"""
        suggestions = []
        score = 100.0
        
        if not target_keyword:
            return SEOCheck(
                check_type='keyword_density',
                status='warning',
                score=50,
                message="No target keyword specified",
                suggestions=["Set a target keyword for better SEO analysis"],
                data={'density': 0, 'occurrences': 0}
            )
        
        # Clean content
        soup = BeautifulSoup(content, 'html.parser')
        text_content = soup.get_text().lower()
        
        # Count keyword occurrences
        keyword_lower = target_keyword.lower()
        occurrences = text_content.count(keyword_lower)
        
        # Calculate density
        total_words = len(text_content.split())
        density = (occurrences / total_words * 100) if total_words > 0 else 0
        
        # Density check
        if density < self.thresholds['keyword_density']['min']:
            score -= 25
            suggestions.append(f"Keyword density too low ({density:.2f}%). Aim for 0.5-2.5%.")
        elif density > self.thresholds['keyword_density']['max']:
            score -= 30
            suggestions.append(f"Keyword density too high ({density:.2f}%). Aim for 0.5-2.5%.")
        
        # Keyword placement
        if keyword_lower not in text_content[:500]:  # First 500 characters
            score -= 15
            suggestions.append("Target keyword not found in the first paragraph.")
        
        # LSI keywords (simple check)
        lsi_keywords = self._get_lsi_keywords(target_keyword)
        found_lsi = sum(1 for lsi in lsi_keywords if lsi in text_content)
        if found_lsi < 2:
            suggestions.append("Consider adding more related keywords (LSI keywords).")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='keyword_density',
            status=status,
            score=score,
            message=f"Keyword density: {density:.2f}% ({occurrences} occurrences)",
            suggestions=suggestions,
            data={'density': density, 'occurrences': occurrences, 'total_words': total_words}
        )

    def analyze_links(self, content: str) -> SEOCheck:
        """Analyze internal and external links"""
        suggestions = []
        score = 100.0
        
        soup = BeautifulSoup(content, 'html.parser')
        links = soup.find_all('a')
        
        internal_links = []
        external_links = []
        
        for link in links:
            href = link.get('href', '')
            if href.startswith('/') or href.startswith('http') and 'yourdomain.com' in href:
                internal_links.append(href)
            elif href.startswith('http'):
                external_links.append(href)
        
        # Internal links check
        if len(internal_links) < self.thresholds['internal_links']['min']:
            score -= 20
            suggestions.append(f"Too few internal links ({len(internal_links)}). Aim for at least {self.thresholds['internal_links']['min']}.")
        
        # External links check
        if len(external_links) == 0:
            score -= 10
            suggestions.append("No external links found. Consider adding authoritative sources.")
        elif len(external_links) > self.thresholds['external_links']['max']:
            score -= 15
            suggestions.append(f"Too many external links ({len(external_links)}). Keep under {self.thresholds['external_links']['max']}.")
        
        # Link text analysis
        link_texts = [link.get_text().strip() for link in links if link.get_text().strip()]
        generic_links = sum(1 for text in link_texts if text.lower() in ['click here', 'read more', 'learn more'])
        if generic_links > 0:
            suggestions.append(f"Found {generic_links} generic link texts. Use descriptive anchor text.")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='links',
            status=status,
            score=score,
            message=f"Links: {len(internal_links)} internal, {len(external_links)} external",
            suggestions=suggestions,
            data={'internal_links': len(internal_links), 'external_links': len(external_links), 'total_links': len(links)}
        )

    def analyze_schema_markup(self, content: str, post_data: Dict[str, Any]) -> SEOCheck:
        """Analyze and suggest schema markup"""
        suggestions = []
        score = 100.0
        
        # Check for existing schema
        soup = BeautifulSoup(content, 'html.parser')
        existing_schema = soup.find('script', {'type': 'application/ld+json'})
        
        if not existing_schema:
            score -= 30
            suggestions.append("No schema markup found. Add structured data for better search visibility.")
            
            # Generate schema suggestion
            schema_suggestion = self._generate_schema_suggestion(post_data)
            suggestions.append(f"Suggested schema: {schema_suggestion}")
        else:
            try:
                schema_data = json.loads(existing_schema.string)
                if '@type' not in schema_data:
                    score -= 15
                    suggestions.append("Schema markup missing @type property.")
            except json.JSONDecodeError:
                score -= 20
                suggestions.append("Invalid JSON in schema markup.")
        
        status = 'pass' if score >= 80 else 'warning' if score >= 60 else 'fail'
        
        return SEOCheck(
            check_type='schema_markup',
            status=status,
            score=score,
            message="Schema markup analysis",
            suggestions=suggestions,
            data={'has_schema': existing_schema is not None}
        )

    def _get_lsi_keywords(self, target_keyword: str) -> List[str]:
        """Get LSI (Latent Semantic Indexing) keywords"""
        # Simple LSI keywords - in production, use a more sophisticated approach
        lsi_map = {
            'ai blog writing': ['content creation', 'artificial intelligence', 'blogging', 'seo', 'marketing'],
            'seo optimization': ['search engine', 'keywords', 'ranking', 'traffic', 'analytics'],
            'content marketing': ['strategy', 'audience', 'engagement', 'conversion', 'brand'],
            'digital marketing': ['online', 'social media', 'email', 'advertising', 'campaigns']
        }
        
        return lsi_map.get(target_keyword.lower(), [])

    def _generate_schema_suggestion(self, post_data: Dict[str, Any]) -> str:
        """Generate schema markup suggestion"""
        schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post_data.get('title', ''),
            "author": {
                "@type": "Person",
                "name": "Author Name"  # Get from user data
            },
            "datePublished": post_data.get('created_at', ''),
            "dateModified": post_data.get('updated_at', ''),
            "publisher": {
                "@type": "Organization",
                "name": "Your Brand",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://yourdomain.com/logo.png"
                }
            },
            "description": post_data.get('meta_description', ''),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": f"https://yourdomain.com/{post_data.get('slug', '')}"
            }
        }
        
        return json.dumps(schema, indent=2)

    async def run_seo_analysis(self, post_id: str) -> SEOAnalysis:
        """Run comprehensive SEO analysis"""
        # Get post data
        post_data = await self.get_post_data(post_id)
        
        # Run all checks
        checks = []
        
        # Title analysis
        checks.append(self.analyze_title(post_data.get('title', ''), post_data.get('target_keyword')))
        
        # Meta description analysis
        checks.append(self.analyze_meta_description(post_data.get('meta_description', ''), post_data.get('target_keyword')))
        
        # Slug analysis
        checks.append(self.analyze_slug(post_data.get('slug', ''), post_data.get('target_keyword')))
        
        # Content analysis
        content = post_data.get('content', '')
        if content:
            checks.append(self.analyze_heading_structure(content))
            checks.append(self.analyze_readability(content))
            checks.append(self.analyze_keyword_density(content, post_data.get('target_keyword', '')))
            checks.append(self.analyze_links(content))
            checks.append(self.analyze_schema_markup(content, post_data))
        
        # Calculate overall score
        overall_score = sum(check.score for check in checks) / len(checks) if checks else 0
        
        # Create analysis object
        analysis = SEOAnalysis(
            post_id=post_id,
            overall_score=overall_score,
            checks=checks,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Save to database
        await self.save_seo_analysis(analysis)
        
        return analysis

    async def save_seo_analysis(self, analysis: SEOAnalysis):
        """Save SEO analysis to database"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor() as cur:
                # Save main analysis
                await cur.execute("""
                    INSERT INTO qa_checks (post_id, check_type, status, score, message, data, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (post_id, check_type) 
                    DO UPDATE SET 
                        status = EXCLUDED.status,
                        score = EXCLUDED.score,
                        message = EXCLUDED.message,
                        data = EXCLUDED.data,
                        updated_at = EXCLUDED.updated_at
                """, (
                    analysis.post_id,
                    'seo_analysis',
                    'pass' if analysis.overall_score >= 80 else 'warning' if analysis.overall_score >= 60 else 'fail',
                    analysis.overall_score,
                    f"SEO Score: {analysis.overall_score:.1f}/100",
                    json.dumps({
                        'overall_score': analysis.overall_score,
                        'checks': [
                            {
                                'type': check.check_type,
                                'status': check.status,
                                'score': check.score,
                                'message': check.message,
                                'suggestions': check.suggestions,
                                'data': check.data
                            }
                            for check in analysis.checks
                        ]
                    }),
                    analysis.created_at,
                    analysis.updated_at
                ))
                
                await conn.commit()

    async def process_seo_request(self, post_id: str) -> Dict[str, Any]:
        """Main processing function"""
        try:
            analysis = await self.run_seo_analysis(post_id)
            
            return {
                'success': True,
                'post_id': post_id,
                'overall_score': analysis.overall_score,
                'checks': [
                    {
                        'type': check.check_type,
                        'status': check.status,
                        'score': check.score,
                        'message': check.message,
                        'suggestions': check.suggestions
                    }
                    for check in analysis.checks
                ],
                'summary': {
                    'pass': len([c for c in analysis.checks if c.status == 'pass']),
                    'warning': len([c for c in analysis.checks if c.status == 'warning']),
                    'fail': len([c for c in analysis.checks if c.status == 'fail'])
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'post_id': post_id
            }

async def main():
    """Test the SEO worker"""
    worker = SEOWorker()
    
    # Test with a sample post ID
    post_id = "test-post-123"
    result = await worker.process_seo_request(post_id)
    
    print("SEO Analysis Result:")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
