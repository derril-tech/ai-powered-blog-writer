#!/usr/bin/env python3
"""
Ghost Connector - Publish content to Ghost CMS platform
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
class GhostPost:
    title: str
    html: str
    slug: Optional[str]
    status: str  # 'draft', 'published', 'scheduled'
    featured: bool
    featured_image: Optional[str]
    meta_title: Optional[str]
    meta_description: Optional[str]
    tags: List[str]
    authors: List[str]
    published_at: Optional[datetime]
    custom_excerpt: Optional[str]

@dataclass
class GhostUser:
    id: str
    name: str
    email: str
    slug: str
    profile_image: str
    cover_image: str
    bio: str
    website: str
    location: str
    facebook: str
    twitter: str
    accessibility: str
    status: str
    locale: str
    visibility: str
    meta_title: str
    meta_description: str
    tour: str
    last_seen: str
    created_at: str
    updated_at: str
    roles: List[str]

@dataclass
class GhostTag:
    id: str
    name: str
    slug: str
    description: str
    feature_image: str
    visibility: str
    meta_title: str
    meta_description: str
    created_at: str
    updated_at: str
    count: Dict[str, int]

@dataclass
class PublishResult:
    success: bool
    post_id: Optional[str]
    url: Optional[str]
    errors: List[str]
    warnings: List[str]

class GhostConnector:
    def __init__(self):
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'database': 'ai_blog_writer',
            'user': 'postgres',
            'password': 'postgres'
        }
        
        # Ghost API configuration
        self.ghost_config = {
            'admin_url': 'https://your-ghost-site.com/ghost/api/v3/admin',
            'content_url': 'https://your-ghost-site.com/ghost/api/v3/content',
            'admin_key': 'YOUR_GHOST_ADMIN_API_KEY',
            'content_key': 'YOUR_GHOST_CONTENT_API_KEY'
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
        """Get authentication headers for Ghost Admin API"""
        return {
            'Authorization': f'Ghost {self.ghost_config["admin_key"]}',
            'Content-Type': 'application/json'
        }

    async def get_ghost_users(self) -> List[GhostUser]:
        """Get Ghost users/authors"""
        try:
            response = requests.get(
                urljoin(self.ghost_config['admin_url'], 'users/'),
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                users_data = response.json()['users']
                return [
                    GhostUser(
                        id=user['id'],
                        name=user['name'],
                        email=user['email'],
                        slug=user['slug'],
                        profile_image=user.get('profile_image', ''),
                        cover_image=user.get('cover_image', ''),
                        bio=user.get('bio', ''),
                        website=user.get('website', ''),
                        location=user.get('location', ''),
                        facebook=user.get('facebook', ''),
                        twitter=user.get('twitter', ''),
                        accessibility=user.get('accessibility', ''),
                        status=user['status'],
                        locale=user.get('locale', ''),
                        visibility=user.get('visibility', ''),
                        meta_title=user.get('meta_title', ''),
                        meta_description=user.get('meta_description', ''),
                        tour=user.get('tour', ''),
                        last_seen=user.get('last_seen', ''),
                        created_at=user['created_at'],
                        updated_at=user['updated_at'],
                        roles=user.get('roles', [])
                    )
                    for user in users_data
                ]
            else:
                print(f"Failed to get Ghost users: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error getting Ghost users: {e}")
            return []

    async def get_ghost_tags(self) -> List[GhostTag]:
        """Get Ghost tags"""
        try:
            response = requests.get(
                urljoin(self.ghost_config['admin_url'], 'tags/'),
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                tags_data = response.json()['tags']
                return [
                    GhostTag(
                        id=tag['id'],
                        name=tag['name'],
                        slug=tag['slug'],
                        description=tag.get('description', ''),
                        feature_image=tag.get('feature_image', ''),
                        visibility=tag.get('visibility', ''),
                        meta_title=tag.get('meta_title', ''),
                        meta_description=tag.get('meta_description', ''),
                        created_at=tag['created_at'],
                        updated_at=tag['updated_at'],
                        count=tag.get('count', {})
                    )
                    for tag in tags_data
                ]
            else:
                print(f"Failed to get Ghost tags: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error getting Ghost tags: {e}")
            return []

    def convert_markdown_to_html(self, markdown_content: str) -> str:
        """Convert markdown content to HTML for Ghost"""
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

    def generate_slug(self, title: str) -> str:
        """Generate URL slug from title"""
        # Convert to lowercase and replace spaces with hyphens
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug = re.sub(r'\s+', '-', slug.strip())
        return slug

    def extract_tags_from_content(self, content: str, target_keyword: str) -> List[str]:
        """Extract relevant tags from content for Ghost"""
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
        
        # Get top words as tags
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        tags = [word for word, freq in sorted_words[:10]]
        
        # Add target keyword as tag
        if target_keyword:
            tags.insert(0, target_keyword.lower())
        
        return list(set(tags))  # Remove duplicates

    async def prepare_post_for_ghost(self, post_data: Dict[str, Any]) -> GhostPost:
        """Prepare post data for Ghost publishing"""
        # Convert markdown to HTML
        html_content = self.convert_markdown_to_html(post_data.get('content', ''))
        
        # Generate slug
        slug = self.generate_slug(post_data.get('title', ''))
        
        # Extract tags
        tags = self.extract_tags_from_content(
            post_data.get('content', ''),
            post_data.get('target_keyword', '')
        )
        
        return GhostPost(
            title=post_data.get('title', ''),
            html=html_content,
            slug=slug,
            status='draft',  # Start as draft for review
            featured=False,
            featured_image=None,
            meta_title=post_data.get('title', ''),
            meta_description=post_data.get('meta_description', ''),
            tags=tags,
            authors=[],  # Will be set based on available users
            published_at=None,
            custom_excerpt=post_data.get('meta_description', '')
        )

    async def create_ghost_post(self, post: GhostPost) -> Optional[str]:
        """Create a new post on Ghost"""
        try:
            # Get available users to set as author
            users = await self.get_ghost_users()
            if users:
                post.authors = [users[0].id]  # Use first user as author
            
            # Prepare post data
            post_data = {
                'posts': [{
                    'title': post.title,
                    'html': post.html,
                    'slug': post.slug,
                    'status': post.status,
                    'featured': post.featured,
                    'feature_image': post.featured_image,
                    'meta_title': post.meta_title,
                    'meta_description': post.meta_description,
                    'custom_excerpt': post.custom_excerpt,
                    'tags': post.tags,
                    'authors': post.authors
                }]
            }
            
            if post.published_at:
                post_data['posts'][0]['published_at'] = post.published_at.isoformat()
            
            # Create post
            response = requests.post(
                urljoin(self.ghost_config['admin_url'], 'posts/'),
                json=post_data,
                headers=self.get_auth_headers(),
                timeout=30
            )
            
            if response.status_code == 201:
                post_data = response.json()['posts'][0]
                return post_data['id']
            else:
                print(f"Failed to create Ghost post: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error creating Ghost post: {e}")
            return None

    async def update_ghost_post(self, post_id: str, post: GhostPost) -> bool:
        """Update an existing post on Ghost"""
        try:
            # Prepare post data
            post_data = {
                'posts': [{
                    'title': post.title,
                    'html': post.html,
                    'slug': post.slug,
                    'status': post.status,
                    'featured': post.featured,
                    'feature_image': post.featured_image,
                    'meta_title': post.meta_title,
                    'meta_description': post.meta_description,
                    'custom_excerpt': post.custom_excerpt,
                    'tags': post.tags,
                    'authors': post.authors
                }]
            }
            
            if post.published_at:
                post_data['posts'][0]['published_at'] = post.published_at.isoformat()
            
            # Update post
            response = requests.put(
                urljoin(self.ghost_config['admin_url'], f'posts/{post_id}/'),
                json=post_data,
                headers=self.get_auth_headers(),
                timeout=30
            )
            
            return response.status_code == 200
                
        except Exception as e:
            print(f"Error updating Ghost post: {e}")
            return False

    async def publish_post_to_ghost(self, post_id: str, publish_status: str = 'draft') -> PublishResult:
        """Main function to publish a post to Ghost"""
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
            
            # Prepare Ghost post
            ghost_post = await self.prepare_post_for_ghost(post_data)
            ghost_post.status = publish_status
            
            # Create post on Ghost
            ghost_post_id = await self.create_ghost_post(ghost_post)
            
            if ghost_post_id:
                result.success = True
                result.post_id = ghost_post_id
                result.url = f"{self.ghost_config['admin_url'].replace('/ghost/api/v3/admin', '')}/p/{ghost_post_id}/"
                
                # Update local post status
                await self.update_post_publish_status(post_id, ghost_post_id, result.url, 'ghost')
            else:
                result.errors.append("Failed to create post on Ghost")
                
        except Exception as e:
            result.errors.append(f"Publishing failed: {str(e)}")
        
        return result

    async def update_post_publish_status(self, post_id: str, ghost_post_id: str, ghost_url: str, platform: str = 'ghost'):
        """Update local post with Ghost publishing information"""
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
                    ghost_post_id,
                    ghost_url,
                    'published',
                    datetime.now()
                ))
                
                await conn.commit()

    async def test_ghost_connection(self) -> Dict[str, Any]:
        """Test Ghost API connection"""
        try:
            # Test authentication by getting users
            users = await self.get_ghost_users()
            
            if users:
                # Get tags
                tags = await self.get_ghost_tags()
                
                return {
                    'success': True,
                    'users': [
                        {
                            'id': user.id,
                            'name': user.name,
                            'email': user.email,
                            'slug': user.slug,
                            'roles': user.roles
                        }
                        for user in users
                    ],
                    'tags': [
                        {
                            'id': tag.id,
                            'name': tag.name,
                            'slug': tag.slug,
                            'description': tag.description
                        }
                        for tag in tags
                    ]
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to authenticate with Ghost API'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Connection test failed: {str(e)}"
            }

    async def process_publish_request(self, post_id: str, publish_status: str = 'draft') -> Dict[str, Any]:
        """Main processing function for Ghost publishing requests"""
        try:
            result = await self.publish_post_to_ghost(post_id, publish_status)
            
            return {
                'success': result.success,
                'post_id': post_id,
                'ghost_post_id': result.post_id,
                'ghost_url': result.url,
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
    """Test the Ghost connector"""
    connector = GhostConnector()
    
    # Test connection
    connection_test = await connector.test_ghost_connection()
    print("Ghost Connection Test:")
    print(json.dumps(connection_test, indent=2, default=str))
    
    # Test publishing (with mock post ID)
    post_id = "test-post-123"
    result = await connector.process_publish_request(post_id, 'draft')
    
    print("\nPublishing Result:")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
