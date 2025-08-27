#!/usr/bin/env python3
"""
Medium Connector - Publish content to Medium platform
"""

import asyncio
import json
import base64
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from urllib.parse import urljoin
import re

@dataclass
class MediumPost:
    title: str
    content: str
    content_format: str  # 'markdown' or 'html'
    tags: List[str]
    canonical_url: Optional[str]
    publish_status: str  # 'draft' or 'public'
    license: str  # 'all-rights-reserved', 'cc-40-by', 'cc-40-by-sa', 'cc-40-by-nd', 'cc-40-by-nc', 'cc-40-by-nc-nd', 'cc-40-by-nc-sa', 'cc-40-zero', 'public-domain'
    notify_followers: bool

@dataclass
class MediumUser:
    id: str
    username: str
    name: str
    url: str
    image_url: str

@dataclass
class MediumPublication:
    id: str
    name: str
    description: str
    url: str
    image_url: str

@dataclass
class PublishResult:
    success: bool
    post_id: Optional[str]
    url: Optional[str]
    errors: List[str]
    warnings: List[str]

class MediumConnector:
    def __init__(self):
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'database': 'ai_blog_writer',
            'user': 'postgres',
            'password': 'postgres'
        }
        
        # Medium API configuration
        self.medium_config = {
            'api_url': 'https://api.medium.com/v1',
            'access_token': 'YOUR_MEDIUM_ACCESS_TOKEN',
            'user_id': None  # Will be fetched from API
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

    def get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for Medium API"""
        return {
            'Authorization': f'Bearer {self.medium_config["access_token"]}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

    async def get_medium_user(self) -> Optional[MediumUser]:
        """Get current Medium user information"""
        try:
            response = requests.get(
                urljoin(self.medium_config['api_url'], 'me'),
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()['data']
                self.medium_config['user_id'] = user_data['id']
                
                return MediumUser(
                    id=user_data['id'],
                    username=user_data['username'],
                    name=user_data['name'],
                    url=user_data['url'],
                    image_url=user_data.get('imageUrl', '')
                )
            else:
                print(f"Failed to get Medium user: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error getting Medium user: {e}")
            return None

    async def get_user_publications(self) -> List[MediumPublication]:
        """Get user's publications"""
        try:
            if not self.medium_config['user_id']:
                await self.get_medium_user()
            
            response = requests.get(
                urljoin(self.medium_config['api_url'], f'users/{self.medium_config["user_id"]}/publications'),
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                publications_data = response.json()['data']
                return [
                    MediumPublication(
                        id=pub['id'],
                        name=pub['name'],
                        description=pub.get('description', ''),
                        url=pub['url'],
                        image_url=pub.get('imageUrl', '')
                    )
                    for pub in publications_data
                ]
            else:
                print(f"Failed to get publications: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error getting publications: {e}")
            return []

    def convert_markdown_to_html(self, markdown_content: str) -> str:
        """Convert markdown content to HTML for Medium"""
        # Simple markdown to HTML conversion
        # In production, use a proper markdown parser
        
        html = markdown_content
        
        # Headers
        html = html.replace('# ', '<h1>').replace('\n# ', '</h1>\n<h1>')
        html = html.replace('## ', '<h2>').replace('\n## ', '</h2>\n<h2>')
        html = html.replace('### ', '<h3>').replace('\n### ', '</h3>\n<h3>')
        
        # Bold and italic
        html = html.replace('**', '<strong>').replace('**', '</strong>')
        html = html.replace('*', '<em>').replace('*', '</em>')
        
        # Code
        html = html.replace('`', '<code>').replace('`', '</code>')
        
        # Links
        import re
        html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
        
        # Lists
        html = re.sub(r'^- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
        html = re.sub(r'^(\d+)\. (.+)$', r'<li>\2</li>', html, flags=re.MULTILINE)
        
        # Paragraphs
        html = re.sub(r'\n\n', '</p>\n<p>', html)
        html = f'<p>{html}</p>'
        
        return html

    def extract_tags_from_content(self, content: str, target_keyword: str) -> List[str]:
        """Extract relevant tags from content for Medium"""
        tags = []
        
        # Extract potential tags from content
        import re
        words = re.findall(r'\b[a-zA-Z]{3,}\b', content.lower())
        
        # Filter common words and get most frequent
        common_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
        
        word_freq = {}
        for word in words:
            if word not in common_words and len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top words as tags (Medium allows max 25 tags)
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        tags = [word for word, freq in sorted_words[:20]]
        
        # Add target keyword as tag
        if target_keyword:
            tags.insert(0, target_keyword.lower())
        
        return list(set(tags))[:25]  # Medium limit

    async def prepare_post_for_medium(self, post_data: Dict[str, Any]) -> MediumPost:
        """Prepare post data for Medium publishing"""
        # Convert markdown to HTML
        html_content = self.convert_markdown_to_html(post_data.get('content', ''))
        
        # Extract tags
        tags = self.extract_tags_from_content(
            post_data.get('content', ''),
            post_data.get('target_keyword', '')
        )
        
        return MediumPost(
            title=post_data.get('title', ''),
            content=html_content,
            content_format='html',
            tags=tags,
            canonical_url=None,  # Can be set if cross-posting
            publish_status='draft',  # Start as draft for review
            license='all-rights-reserved',
            notify_followers=False
        )

    async def create_medium_post(self, post: MediumPost, publication_id: Optional[str] = None) -> Optional[str]:
        """Create a new post on Medium"""
        try:
            if not self.medium_config['user_id']:
                await self.get_medium_user()
            
            # Prepare post data
            post_data = {
                'title': post.title,
                'contentFormat': post.content_format,
                'content': post.content,
                'tags': post.tags,
                'publishStatus': post.publish_status,
                'license': post.license,
                'notifyFollowers': post.notify_followers
            }
            
            if post.canonical_url:
                post_data['canonicalUrl'] = post.canonical_url
            
            # Determine endpoint
            if publication_id:
                endpoint = f'publications/{publication_id}/posts'
            else:
                endpoint = f'users/{self.medium_config["user_id"]}/posts'
            
            # Create post
            response = requests.post(
                urljoin(self.medium_config['api_url'], endpoint),
                json=post_data,
                headers=self.get_auth_headers(),
                timeout=30
            )
            
            if response.status_code == 201:
                post_data = response.json()['data']
                return post_data['id']
            else:
                print(f"Failed to create Medium post: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error creating Medium post: {e}")
            return None

    async def update_medium_post(self, post_id: str, post: MediumPost) -> bool:
        """Update an existing post on Medium"""
        try:
            # Prepare post data
            post_data = {
                'title': post.title,
                'contentFormat': post.content_format,
                'content': post.content,
                'tags': post.tags,
                'publishStatus': post.publish_status,
                'license': post.license,
                'notifyFollowers': post.notify_followers
            }
            
            if post.canonical_url:
                post_data['canonicalUrl'] = post.canonical_url
            
            # Update post
            response = requests.put(
                urljoin(self.medium_config['api_url'], f'posts/{post_id}'),
                json=post_data,
                headers=self.get_auth_headers(),
                timeout=30
            )
            
            return response.status_code == 200
                
        except Exception as e:
            print(f"Error updating Medium post: {e}")
            return False

    async def publish_post_to_medium(self, post_id: str, publish_status: str = 'draft', publication_id: Optional[str] = None) -> PublishResult:
        """Main function to publish a post to Medium"""
        result = PublishResult(
            success=False,
            post_id=None,
            url=None,
            errors=[],
            warnings=[]
        )
        
        try:
            # Get post data
            post_data = await self.get_post_data(post_id)
            
            # Prepare Medium post
            medium_post = await self.prepare_post_for_medium(post_data)
            medium_post.publish_status = publish_status
            
            # Create post on Medium
            medium_post_id = await self.create_medium_post(medium_post, publication_id)
            
            if medium_post_id:
                result.success = True
                result.post_id = medium_post_id
                result.url = f"https://medium.com/p/{medium_post_id}"
                
                # Update local post status
                await self.update_post_publish_status(post_id, medium_post_id, result.url, 'medium')
            else:
                result.errors.append("Failed to create post on Medium")
                
        except Exception as e:
            result.errors.append(f"Publishing failed: {str(e)}")
        
        return result

    async def update_post_publish_status(self, post_id: str, medium_post_id: str, medium_url: str, platform: str = 'medium'):
        """Update local post with Medium publishing information"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO publishes (post_id, platform, platform_post_id, url, status, published_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (post_id, platform) 
                    DO UPDATE SET 
                        platform_post_id = EXCLUDED.platform_post_id,
                        url = EXCLUDED.url,
                        status = EXCLUDED.status,
                        published_at = EXCLUDED.published_at
                """, (
                    post_id,
                    platform,
                    medium_post_id,
                    medium_url,
                    'published',
                    datetime.now()
                ))
                
                await conn.commit()

    async def test_medium_connection(self) -> Dict[str, Any]:
        """Test Medium API connection"""
        try:
            # Test authentication and get user info
            user = await self.get_medium_user()
            
            if user:
                # Get publications
                publications = await self.get_user_publications()
                
                return {
                    'success': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'name': user.name,
                        'url': user.url
                    },
                    'publications': [
                        {
                            'id': pub.id,
                            'name': pub.name,
                            'url': pub.url
                        }
                        for pub in publications
                    ]
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to authenticate with Medium API'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Connection test failed: {str(e)}"
            }

    async def process_publish_request(self, post_id: str, publish_status: str = 'draft', publication_id: Optional[str] = None) -> Dict[str, Any]:
        """Main processing function for Medium publishing requests"""
        try:
            result = await self.publish_post_to_medium(post_id, publish_status, publication_id)
            
            return {
                'success': result.success,
                'post_id': post_id,
                'medium_post_id': result.post_id,
                'medium_url': result.url,
                'errors': result.errors,
                'warnings': result.warnings
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'post_id': post_id
            }

async def main():
    """Test the Medium connector"""
    connector = MediumConnector()
    
    # Test connection
    connection_test = await connector.test_medium_connection()
    print("Medium Connection Test:")
    print(json.dumps(connection_test, indent=2, default=str))
    
    # Test publishing (with mock post ID)
    post_id = "test-post-123"
    result = await connector.process_publish_request(post_id, 'draft')
    
    print("\nPublishing Result:")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
