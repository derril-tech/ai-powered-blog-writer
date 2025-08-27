# Created automatically by Cursor AI (2024-01-27)

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import os
import tempfile
from urllib.parse import urlparse
import hashlib

import httpx
from PIL import Image
import openai
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ImageResult:
    """Represents an image search result"""
    url: str
    title: str
    description: str
    width: int
    height: int
    file_size: int
    source: str  # 'unsplash', 'pexels', 'ai_generated', etc.
    license: str
    alt_text: Optional[str] = None

@dataclass
class ProcessedImage:
    """Represents a processed image ready for use"""
    original_url: str
    processed_url: str
    filename: str
    alt_text: str
    width: int
    height: int
    file_size: int
    mime_type: str

class ImageWorker:
    """Worker for image search, processing, and alt text generation"""
    
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.unsplash_access_key = os.getenv('UNSPLASH_ACCESS_KEY')
        self.pexels_api_key = os.getenv('PEXELS_API_KEY')
        self.s3_endpoint = os.getenv('S3_ENDPOINT')
        self.s3_access_key = os.getenv('S3_ACCESS_KEY')
        self.s3_secret_key = os.getenv('S3_SECRET_KEY')
        self.s3_bucket = os.getenv('S3_BUCKET')
        
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        openai.api_key = self.openai_api_key
    
    async def search_images(self, query: str, count: int = 10) -> List[ImageResult]:
        """Search for images from multiple sources"""
        logger.info(f"Searching for images with query: {query}")
        
        results = []
        
        # Search Unsplash
        if self.unsplash_access_key:
            unsplash_results = await self._search_unsplash(query, count // 2)
            results.extend(unsplash_results)
        
        # Search Pexels
        if self.pexels_api_key:
            pexels_results = await self._search_pexels(query, count // 2)
            results.extend(pexels_results)
        
        # If no results from stock photo services, generate AI images
        if not results:
            ai_results = await self._generate_ai_images(query, count)
            results.extend(ai_results)
        
        return results[:count]
    
    async def _search_unsplash(self, query: str, count: int) -> List[ImageResult]:
        """Search Unsplash for images"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    'query': query,
                    'per_page': count,
                    'client_id': self.unsplash_access_key
                }
                
                response = await client.get('https://api.unsplash.com/search/photos', params=params)
                response.raise_for_status()
                
                data = response.json()
                results = []
                
                for photo in data.get('results', []):
                    result = ImageResult(
                        url=photo['urls']['regular'],
                        title=photo.get('description', ''),
                        description=photo.get('alt_description', ''),
                        width=photo['width'],
                        height=photo['height'],
                        file_size=0,  # Unsplash doesn't provide file size
                        source='unsplash',
                        license='Unsplash License'
                    )
                    results.append(result)
                
                return results
                
        except Exception as e:
            logger.error(f"Error searching Unsplash: {e}")
            return []
    
    async def _search_pexels(self, query: str, count: int) -> List[ImageResult]:
        """Search Pexels for images"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {'Authorization': self.pexels_api_key}
                params = {'query': query, 'per_page': count}
                
                response = await client.get('https://api.pexels.com/v1/search', headers=headers, params=params)
                response.raise_for_status()
                
                data = response.json()
                results = []
                
                for photo in data.get('photos', []):
                    result = ImageResult(
                        url=photo['src']['large'],
                        title=photo.get('alt', ''),
                        description=photo.get('alt', ''),
                        width=photo['width'],
                        height=photo['height'],
                        file_size=0,  # Pexels doesn't provide file size
                        source='pexels',
                        license='Pexels License'
                    )
                    results.append(result)
                
                return results
                
        except Exception as e:
            logger.error(f"Error searching Pexels: {e}")
            return []
    
    async def _generate_ai_images(self, query: str, count: int) -> List[ImageResult]:
        """Generate AI images using DALL-E or similar"""
        try:
            # For now, return mock AI-generated images
            # In production, integrate with DALL-E, Midjourney, or similar
            results = []
            
            for i in range(count):
                result = ImageResult(
                    url=f"https://example.com/ai-generated-{i}.jpg",
                    title=f"AI Generated: {query}",
                    description=f"AI-generated image for '{query}'",
                    width=1024,
                    height=1024,
                    file_size=500000,  # 500KB estimate
                    source='ai_generated',
                    license='AI Generated'
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error generating AI images: {e}")
            return []
    
    async def generate_alt_text(self, image_url: str, context: str = "") -> str:
        """Generate alt text for an image using AI"""
        try:
            prompt = f"""
Generate a concise, descriptive alt text for this image. The image is related to: {context}

Requirements:
1. Be descriptive but concise (under 125 characters)
2. Include relevant keywords naturally
3. Be accessible and informative
4. Don't start with "Image of" or "Picture of"
5. Focus on the main subject and purpose

Generate only the alt text, nothing else.
"""
            
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at writing accessible alt text for images."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=100
            )
            
            alt_text = response.choices[0].message.content.strip()
            return alt_text
            
        except Exception as e:
            logger.error(f"Error generating alt text: {e}")
            return f"Image related to {context}"
    
    async def download_image(self, url: str) -> bytes:
        """Download image from URL"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.content
                
        except Exception as e:
            logger.error(f"Error downloading image from {url}: {e}")
            raise
    
    def process_image(self, image_data: bytes, max_width: int = 1200, max_height: int = 800, quality: int = 85) -> bytes:
        """Process image: resize, compress, and optimize"""
        try:
            # Open image
            image = Image.open(tempfile.NamedTemporaryFile(delete=False))
            image.save(image_data)
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # Resize if necessary
            if image.width > max_width or image.height > max_height:
                image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save processed image
            output_buffer = tempfile.NamedTemporaryFile(delete=False)
            image.save(output_buffer, 'JPEG', quality=quality, optimize=True)
            
            with open(output_buffer.name, 'rb') as f:
                processed_data = f.read()
            
            # Clean up temporary files
            os.unlink(output_buffer.name)
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            raise
    
    async def upload_to_storage(self, image_data: bytes, filename: str, mime_type: str = 'image/jpeg') -> str:
        """Upload processed image to storage (S3/MinIO)"""
        try:
            # For now, return a mock URL
            # In production, implement actual S3/MinIO upload
            file_hash = hashlib.md5(image_data).hexdigest()
            url = f"{self.s3_endpoint}/{self.s3_bucket}/{file_hash}/{filename}"
            
            logger.info(f"Uploaded image to: {url}")
            return url
            
        except Exception as e:
            logger.error(f"Error uploading image: {e}")
            raise
    
    async def save_image_to_database(self, image_data: ProcessedImage, org_id: str) -> str:
        """Save image metadata to database"""
        try:
            with self.SessionLocal() as session:
                query = text("""
                    INSERT INTO media_library (filename, original_name, mime_type, size, url, alt_text, org_id, created_at, updated_at)
                    VALUES (:filename, :original_name, :mime_type, :size, :url, :alt_text, :org_id, NOW(), NOW())
                    RETURNING id
                """)
                
                result = session.execute(query, {
                    'filename': image_data.filename,
                    'original_name': image_data.filename,
                    'mime_type': image_data.mime_type,
                    'size': image_data.file_size,
                    'url': image_data.processed_url,
                    'alt_text': image_data.alt_text,
                    'org_id': org_id
                })
                
                image_id = result.fetchone()[0]
                session.commit()
                
                logger.info(f"Saved image to database: {image_id}")
                return image_id
                
        except Exception as e:
            logger.error(f"Error saving image to database: {e}")
            raise
    
    async def process_image_request(self, query: str, context: str = "", org_id: str = "", count: int = 5) -> Dict[str, Any]:
        """Main method to process image search and processing request"""
        try:
            # Search for images
            image_results = await self.search_images(query, count)
            
            processed_images = []
            
            for result in image_results:
                try:
                    # Download image
                    image_data = await self.download_image(result.url)
                    
                    # Process image
                    processed_data = self.process_image(image_data)
                    
                    # Generate alt text
                    alt_text = await self.generate_alt_text(result.url, context or query)
                    
                    # Generate filename
                    file_hash = hashlib.md5(processed_data).hexdigest()[:8]
                    filename = f"{query.replace(' ', '-')}-{file_hash}.jpg"
                    
                    # Upload to storage
                    processed_url = await self.upload_to_storage(processed_data, filename)
                    
                    # Create processed image object
                    processed_image = ProcessedImage(
                        original_url=result.url,
                        processed_url=processed_url,
                        filename=filename,
                        alt_text=alt_text,
                        width=result.width,
                        height=result.height,
                        file_size=len(processed_data),
                        mime_type='image/jpeg'
                    )
                    
                    # Save to database if org_id provided
                    if org_id:
                        image_id = await self.save_image_to_database(processed_image, org_id)
                        processed_image.image_id = image_id
                    
                    processed_images.append(processed_image)
                    
                except Exception as e:
                    logger.error(f"Error processing image {result.url}: {e}")
                    continue
            
            return {
                'query': query,
                'context': context,
                'images_found': len(image_results),
                'images_processed': len(processed_images),
                'images': [
                    {
                        'url': img.processed_url,
                        'filename': img.filename,
                        'alt_text': img.alt_text,
                        'width': img.width,
                        'height': img.height,
                        'file_size': img.file_size,
                        'mime_type': img.mime_type
                    }
                    for img in processed_images
                ]
            }
            
        except Exception as e:
            logger.error(f"Error processing image request: {e}")
            raise

async def main():
    """Main function for testing the worker"""
    worker = ImageWorker()
    
    # Test with a sample query
    test_query = "AI technology"
    test_context = "Blog post about artificial intelligence"
    test_org_id = "550e8400-e29b-41d4-a716-446655440000"  # Sample UUID
    
    try:
        result = await worker.process_image_request(test_query, test_context, test_org_id, 3)
        print(f"Image processing result: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
