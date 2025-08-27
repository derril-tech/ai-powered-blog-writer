#!/usr/bin/env python3
"""
Publish Worker - WordPress API integration for publishing posts and media
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
from requests.auth import HTTPBasicAuth
import xmlrpc.client
from urllib.parse import urljoin, urlparse
import mimetypes
import os

@dataclass
class WordPressPost:
    title: str
    content: str
    excerpt: str
    status: str  # 'draft', 'publish', 'private', 'pending'
    categories: List[str]
    tags: List[str]
    featured_media_id: Optional[int]
    meta: Dict[str, Any]

@dataclass
class WordPressMedia:
    file_name: str
    file_data: bytes
    mime_type: str
    alt_text: str
    caption: str

@dataclass
class PublishResult:
    success: bool
    post_id: Optional[int]
    url: Optional[str]
    media_ids: List[int]
    errors: List[str]
    warnings: List[str]

class WordPressPublisher:
    def __init__(self):
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'database': 'ai_blog_writer',
            'user': 'postgres',
            'password': 'postgres'
        }
        
        # WordPress configuration
        self.wp_config = {
            'site_url': 'https://your-wordpress-site.com',
            'api_url': 'https://your-wordpress-site.com/wp-json/wp/v2',
            'username': 'YOUR_WP_USERNAME',
            'password': 'YOUR_WP_PASSWORD',
            'app_password': 'YOUR_APP_PASSWORD',  # For modern WP sites
            'use_xmlrpc': False  # Set to True for older WP sites
        }

    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    async def get_post_data(self, post_id: str) -> Dict[str, Any]:
        """Fetch post data including content and metadata"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT p.*, d.content, d.citations, o.outline_data
                    FROM posts p
                    LEFT JOIN drafts d ON p.id = d.post_id
                    LEFT JOIN outlines o ON p.id = o.post_id
                    WHERE p.id = %s
                """, (post_id,))
                post_data = await cur.fetchone()
                
                if not post_data:
                    raise ValueError(f"Post {post_id} not found")
                
                return dict(post_data)

    async def get_post_images(self, post_id: str) -> List[Dict[str, Any]]:
        """Fetch images associated with the post"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT * FROM images 
                    WHERE post_id = %s AND status = 'processed'
                    ORDER BY created_at
                """, (post_id,))
                images = await cur.fetchall()
                
                return [dict(image) for image in images]

    def convert_markdown_to_html(self, markdown_content: str) -> str:
        """Convert markdown content to HTML for WordPress"""
        # Simple markdown to HTML conversion
        # In production, use a proper markdown parser like markdown2 or python-markdown
        
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

    def get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for WordPress API"""
        if self.wp_config.get('app_password'):
            # Use Application Passwords (recommended for modern WP)
            credentials = f"{self.wp_config['username']}:{self.wp_config['app_password']}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            return {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }
        else:
            # Use basic auth (legacy)
            return {
                'Content-Type': 'application/json'
            }

    def get_auth_auth(self) -> Optional[HTTPBasicAuth]:
        """Get basic auth for requests"""
        if not self.wp_config.get('app_password'):
            return HTTPBasicAuth(
                self.wp_config['username'],
                self.wp_config['password']
            )
        return None

    async def upload_media_to_wordpress(self, media: WordPressMedia) -> Optional[int]:
        """Upload media file to WordPress"""
        try:
            # Prepare the media upload
            media_url = urljoin(self.wp_config['api_url'], 'media')
            
            # Create multipart form data
            files = {
                'file': (media.file_name, media.file_data, media.mime_type)
            }
            
            data = {
                'alt_text': media.alt_text,
                'caption': media.caption,
                'description': media.caption
            }
            
            # Upload media
            response = requests.post(
                media_url,
                files=files,
                data=data,
                headers=self.get_auth_headers(),
                auth=self.get_auth_auth(),
                timeout=30
            )
            
            if response.status_code == 201:
                media_data = response.json()
                return media_data.get('id')
            else:
                print(f"Failed to upload media: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error uploading media: {e}")
            return None

    async def create_wordpress_post(self, post: WordPressPost) -> Optional[int]:
        """Create a new post in WordPress"""
        try:
            # Prepare post data
            post_data = {
                'title': post.title,
                'content': post.content,
                'excerpt': post.excerpt,
                'status': post.status,
                'categories': post.categories,
                'tags': post.tags,
                'meta': post.meta
            }
            
            if post.featured_media_id:
                post_data['featured_media'] = post.featured_media_id
            
            # Create post
            response = requests.post(
                urljoin(self.wp_config['api_url'], 'posts'),
                json=post_data,
                headers=self.get_auth_headers(),
                auth=self.get_auth_auth(),
                timeout=30
            )
            
            if response.status_code == 201:
                post_data = response.json()
                return post_data.get('id')
            else:
                print(f"Failed to create post: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error creating post: {e}")
            return None

    async def update_wordpress_post(self, wp_post_id: int, post: WordPressPost) -> bool:
        """Update an existing post in WordPress"""
        try:
            # Prepare post data
            post_data = {
                'title': post.title,
                'content': post.content,
                'excerpt': post.excerpt,
                'status': post.status,
                'categories': post.categories,
                'tags': post.tags,
                'meta': post.meta
            }
            
            if post.featured_media_id:
                post_data['featured_media'] = post.featured_media_id
            
            # Update post
            response = requests.put(
                urljoin(self.wp_config['api_url'], f'posts/{wp_post_id}'),
                json=post_data,
                headers=self.get_auth_headers(),
                auth=self.get_auth_auth(),
                timeout=30
            )
            
            return response.status_code == 200
                
        except Exception as e:
            print(f"Error updating post: {e}")
            return False

    async def get_wordpress_categories(self) -> List[Dict[str, Any]]:
        """Get available categories from WordPress"""
        try:
            response = requests.get(
                urljoin(self.wp_config['api_url'], 'categories'),
                headers=self.get_auth_headers(),
                auth=self.get_auth_auth(),
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get categories: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error getting categories: {e}")
            return []

    async def get_wordpress_tags(self) -> List[Dict[str, Any]]:
        """Get available tags from WordPress"""
        try:
            response = requests.get(
                urljoin(self.wp_config['api_url'], 'tags'),
                headers=self.get_auth_headers(),
                auth=self.get_auth_auth(),
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get tags: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error getting tags: {e}")
            return []

    def extract_categories_from_content(self, content: str, target_keyword: str) -> List[str]:
        """Extract relevant categories from content and target keyword"""
        categories = []
        
        # Simple category extraction based on content analysis
        content_lower = content.lower()
        
        # Technology-related categories
        if any(word in content_lower for word in ['ai', 'artificial intelligence', 'machine learning']):
            categories.append('Technology')
        
        if any(word in content_lower for word in ['marketing', 'seo', 'content']):
            categories.append('Marketing')
        
        if any(word in content_lower for word in ['business', 'strategy', 'growth']):
            categories.append('Business')
        
        if any(word in content_lower for word in ['productivity', 'tools', 'automation']):
            categories.append('Productivity')
        
        # Add target keyword as category if it's a main topic
        if target_keyword and len(target_keyword.split()) <= 3:
            categories.append(target_keyword.title())
        
        return list(set(categories))  # Remove duplicates

    def extract_tags_from_content(self, content: str, target_keyword: str) -> List[str]:
        """Extract relevant tags from content"""
        tags = []
        
        # Extract potential tags from content
        import re
        words = re.findall(r'\b[a-zA-Z]{3,}\b', content.lower())
        
        # Filter common words and get most frequent
        common_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'this', 'that', 'they', 'have', 'from', 'word', 'what', 'said', 'each', 'which', 'their', 'time', 'will', 'would', 'there', 'could', 'been', 'call', 'first', 'find', 'made', 'may', 'part', 'over', 'come', 'know', 'take', 'than', 'into', 'just', 'more', 'other', 'about', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'has', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'}
        
        word_freq = {}
        for word in words:
            if word not in common_words and len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top words as tags
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        tags = [word for word, freq in sorted_words[:10]]
        
        # Add target keyword as tag
        if target_keyword:
            tags.insert(0, target_keyword.lower())
        
        return list(set(tags))  # Remove duplicates

    async def prepare_post_for_wordpress(self, post_data: Dict[str, Any]) -> WordPressPost:
        """Prepare post data for WordPress publishing"""
        # Convert markdown to HTML
        html_content = self.convert_markdown_to_html(post_data.get('content', ''))
        
        # Extract categories and tags
        categories = self.extract_categories_from_content(
            post_data.get('content', ''),
            post_data.get('target_keyword', '')
        )
        
        tags = self.extract_tags_from_content(
            post_data.get('content', ''),
            post_data.get('target_keyword', '')
        )
        
        # Prepare meta data
        meta = {
            'target_keyword': post_data.get('target_keyword', ''),
            'word_count': post_data.get('word_count', 0),
            'seo_score': post_data.get('seo_score', 0),
            'ai_generated': True,
            'source_post_id': post_data.get('id'),
            'published_at': datetime.now().isoformat()
        }
        
        return WordPressPost(
            title=post_data.get('title', ''),
            content=html_content,
            excerpt=post_data.get('meta_description', ''),
            status='draft',  # Start as draft for review
            categories=categories,
            tags=tags,
            featured_media_id=None,  # Will be set after media upload
            meta=meta
        )

    async def publish_post_to_wordpress(self, post_id: str, publish_status: str = 'draft') -> PublishResult:
        """Main function to publish a post to WordPress"""
        result = PublishResult(
            success=False,
            post_id=None,
            url=None,
            media_ids=[],
            errors=[],
            warnings=[]
        )
        
        try:
            # Get post data
            post_data = await self.get_post_data(post_id)
            
            # Get associated images
            images = await self.get_post_images(post_id)
            
            # Upload media files
            media_ids = []
            featured_media_id = None
            
            for image in images:
                try:
                    # Download image data (in production, get from S3/MinIO)
                    # For now, we'll assume the image data is available
                    media = WordPressMedia(
                        file_name=image.get('filename', 'image.jpg'),
                        file_data=b'mock_image_data',  # Replace with actual image data
                        mime_type=image.get('mime_type', 'image/jpeg'),
                        alt_text=image.get('alt_text', ''),
                        caption=image.get('caption', '')
                    )
                    
                    wp_media_id = await self.upload_media_to_wordpress(media)
                    if wp_media_id:
                        media_ids.append(wp_media_id)
                        
                        # Set first image as featured media
                        if not featured_media_id:
                            featured_media_id = wp_media_id
                            
                except Exception as e:
                    result.warnings.append(f"Failed to upload image {image.get('filename', 'unknown')}: {str(e)}")
            
            # Prepare WordPress post
            wp_post = await self.prepare_post_for_wordpress(post_data)
            wp_post.status = publish_status
            wp_post.featured_media_id = featured_media_id
            
            # Create post in WordPress
            wp_post_id = await self.create_wordpress_post(wp_post)
            
            if wp_post_id:
                result.success = True
                result.post_id = wp_post_id
                result.url = f"{self.wp_config['site_url']}/?p={wp_post_id}"
                result.media_ids = media_ids
                
                # Update local post status
                await self.update_post_publish_status(post_id, wp_post_id, result.url)
            else:
                result.errors.append("Failed to create post in WordPress")
                
        except Exception as e:
            result.errors.append(f"Publishing failed: {str(e)}")
        
        return result

    async def update_post_publish_status(self, post_id: str, wp_post_id: int, wp_url: str):
        """Update local post with WordPress publishing information"""
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
                    'wordpress',
                    str(wp_post_id),
                    wp_url,
                    'published',
                    datetime.now()
                ))
                
                # Update post status
                await cur.execute("""
                    UPDATE posts 
                    SET status = 'published', updated_at = %s
                    WHERE id = %s
                """, (datetime.now(), post_id))
                
                await conn.commit()

    async def test_wordpress_connection(self) -> Dict[str, Any]:
        """Test WordPress API connection"""
        try:
            # Test basic connection
            response = requests.get(
                urljoin(self.wp_config['site_url'], 'wp-json'),
                timeout=10
            )
            
            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f"WordPress site not accessible: {response.status_code}"
                }
            
            # Test authentication
            auth_response = requests.get(
                urljoin(self.wp_config['api_url'], 'users/me'),
                headers=self.get_auth_headers(),
                auth=self.get_auth_auth(),
                timeout=10
            )
            
            if auth_response.status_code == 200:
                user_data = auth_response.json()
                return {
                    'success': True,
                    'user': user_data.get('name', 'Unknown'),
                    'capabilities': user_data.get('capabilities', {})
                }
            else:
                return {
                    'success': False,
                    'error': f"Authentication failed: {auth_response.status_code}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Connection test failed: {str(e)}"
            }

    async def process_publish_request(self, post_id: str, publish_status: str = 'draft') -> Dict[str, Any]:
        """Main processing function for publishing requests"""
        try:
            result = await self.publish_post_to_wordpress(post_id, publish_status)
            
            return {
                'success': result.success,
                'post_id': post_id,
                'wordpress_post_id': result.post_id,
                'wordpress_url': result.url,
                'media_ids': result.media_ids,
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
    """Test the WordPress publisher"""
    publisher = WordPressPublisher()
    
    # Test connection
    connection_test = await publisher.test_wordpress_connection()
    print("WordPress Connection Test:")
    print(json.dumps(connection_test, indent=2, default=str))
    
    # Test publishing (with mock post ID)
    post_id = "test-post-123"
    result = await publisher.process_publish_request(post_id, 'draft')
    
    print("\nPublishing Result:")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
