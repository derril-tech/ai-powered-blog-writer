# Created automatically by Cursor AI (2024-01-27)

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

import httpx
from pydantic import BaseModel, HttpUrl
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
class SerpResult:
    """Structured SERP data"""
    keyword: str
    titles: List[str]
    descriptions: List[str]
    urls: List[str]
    featured_snippets: List[Dict[str, Any]]
    people_also_ask: List[str]
    related_searches: List[str]
    entities: List[Dict[str, Any]]
    search_volume: Optional[int] = None
    difficulty: Optional[int] = None
    cpc: Optional[float] = None
    timestamp: datetime = None

class SerpWorker:
    """Worker for fetching and processing SERP data"""
    
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        self.serpapi_key = os.getenv('SERPAPI_KEY')
        self.google_api_key = os.getenv('GOOGLE_SEARCH_API_KEY')
        
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    async def fetch_serp_data(self, keyword: str) -> SerpResult:
        """Fetch SERP data from multiple sources"""
        logger.info(f"Fetching SERP data for keyword: {keyword}")
        
        # Try SerpAPI first, fallback to Google Custom Search
        serp_data = await self._fetch_from_serpapi(keyword)
        if not serp_data:
            serp_data = await self._fetch_from_google(keyword)
        
        if not serp_data:
            raise Exception(f"Failed to fetch SERP data for keyword: {keyword}")
        
        # Extract structured data
        result = SerpResult(
            keyword=keyword,
            titles=serp_data.get('titles', []),
            descriptions=serp_data.get('descriptions', []),
            urls=serp_data.get('urls', []),
            featured_snippets=serp_data.get('featured_snippets', []),
            people_also_ask=serp_data.get('people_also_ask', []),
            related_searches=serp_data.get('related_searches', []),
            entities=serp_data.get('entities', []),
            timestamp=datetime.utcnow()
        )
        
        return result
    
    async def _fetch_from_serpapi(self, keyword: str) -> Optional[Dict[str, Any]]:
        """Fetch data from SerpAPI"""
        if not self.serpapi_key:
            logger.warning("SERPAPI_KEY not configured, skipping SerpAPI")
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    'q': keyword,
                    'api_key': self.serpapi_key,
                    'engine': 'google',
                    'num': 10,
                    'gl': 'us',
                    'hl': 'en'
                }
                
                response = await client.get('https://serpapi.com/search', params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Extract structured data
                organic_results = data.get('organic_results', [])
                featured_snippet = data.get('answer_box', {})
                people_also_ask = data.get('related_questions', [])
                related_searches = data.get('related_searches', [])
                
                return {
                    'titles': [result.get('title', '') for result in organic_results],
                    'descriptions': [result.get('snippet', '') for result in organic_results],
                    'urls': [result.get('link', '') for result in organic_results],
                    'featured_snippets': [featured_snippet] if featured_snippet else [],
                    'people_also_ask': [q.get('question', '') for q in people_also_ask],
                    'related_searches': [s.get('query', '') for s in related_searches],
                    'entities': self._extract_entities(organic_results)
                }
                
        except Exception as e:
            logger.error(f"Error fetching from SerpAPI: {e}")
            return None
    
    async def _fetch_from_google(self, keyword: str) -> Optional[Dict[str, Any]]:
        """Fetch data from Google Custom Search API"""
        if not self.google_api_key:
            logger.warning("GOOGLE_SEARCH_API_KEY not configured, skipping Google Search")
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    'key': self.google_api_key,
                    'cx': os.getenv('GOOGLE_SEARCH_ENGINE_ID', ''),
                    'q': keyword,
                    'num': 10
                }
                
                response = await client.get('https://www.googleapis.com/customsearch/v1', params=params)
                response.raise_for_status()
                
                data = response.json()
                items = data.get('items', [])
                
                return {
                    'titles': [item.get('title', '') for item in items],
                    'descriptions': [item.get('snippet', '') for item in items],
                    'urls': [item.get('link', '') for item in items],
                    'featured_snippets': [],
                    'people_also_ask': [],
                    'related_searches': [],
                    'entities': self._extract_entities(items)
                }
                
        except Exception as e:
            logger.error(f"Error fetching from Google Search: {e}")
            return None
    
    def _extract_entities(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract named entities from search results"""
        entities = []
        
        # Simple entity extraction (in production, use NER models)
        for result in results:
            text = f"{result.get('title', '')} {result.get('snippet', '')}"
            
            # Extract potential entities (simplified)
            # In production, use spaCy or similar NER
            words = text.split()
            for word in words:
                if word[0].isupper() and len(word) > 2:
                    entities.append({
                        'text': word,
                        'type': 'PERSON',  # Simplified
                        'confidence': 0.5
                    })
        
        return entities[:10]  # Limit to top 10 entities
    
    async def save_serp_data(self, serp_result: SerpResult, org_id: str) -> str:
        """Save SERP data to database"""
        try:
            with self.SessionLocal() as session:
                # Insert or update keyword
                keyword_query = text("""
                    INSERT INTO keywords (term, org_id, search_volume, difficulty, cpc, created_at, updated_at)
                    VALUES (:term, :org_id, :search_volume, :difficulty, :cpc, NOW(), NOW())
                    ON CONFLICT (term, org_id) DO UPDATE SET
                        search_volume = EXCLUDED.search_volume,
                        difficulty = EXCLUDED.difficulty,
                        cpc = EXCLUDED.cpc,
                        updated_at = NOW()
                    RETURNING id
                """)
                
                result = session.execute(keyword_query, {
                    'term': serp_result.keyword,
                    'org_id': org_id,
                    'search_volume': serp_result.search_volume,
                    'difficulty': serp_result.difficulty,
                    'cpc': serp_result.cpc
                })
                
                keyword_id = result.fetchone()[0]
                
                # Store SERP data as JSON in a separate table or as metadata
                serp_data_query = text("""
                    INSERT INTO keywords (term, org_id, settings, created_at, updated_at)
                    VALUES (:term, :org_id, :serp_data, NOW(), NOW())
                    ON CONFLICT (term, org_id) DO UPDATE SET
                        settings = EXCLUDED.serp_data,
                        updated_at = NOW()
                """)
                
                serp_data = {
                    'titles': serp_result.titles,
                    'descriptions': serp_result.descriptions,
                    'urls': serp_result.urls,
                    'featured_snippets': serp_result.featured_snippets,
                    'people_also_ask': serp_result.people_also_ask,
                    'related_searches': serp_result.related_searches,
                    'entities': serp_result.entities,
                    'timestamp': serp_result.timestamp.isoformat()
                }
                
                session.execute(serp_data_query, {
                    'term': serp_result.keyword,
                    'org_id': org_id,
                    'serp_data': json.dumps(serp_data)
                })
                
                session.commit()
                logger.info(f"Saved SERP data for keyword: {serp_result.keyword}")
                return keyword_id
                
        except Exception as e:
            logger.error(f"Error saving SERP data: {e}")
            raise
    
    async def process_keyword(self, keyword: str, org_id: str) -> Dict[str, Any]:
        """Main method to process a keyword and return results"""
        try:
            # Fetch SERP data
            serp_result = await self.fetch_serp_data(keyword)
            
            # Save to database
            keyword_id = await self.save_serp_data(serp_result, org_id)
            
            return {
                'keyword_id': keyword_id,
                'keyword': keyword,
                'serp_data': {
                    'titles': serp_result.titles,
                    'descriptions': serp_result.descriptions,
                    'urls': serp_result.urls,
                    'featured_snippets': serp_result.featured_snippets,
                    'people_also_ask': serp_result.people_also_ask,
                    'related_searches': serp_result.related_searches,
                    'entities': serp_result.entities,
                    'timestamp': serp_result.timestamp.isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing keyword {keyword}: {e}")
            raise

async def main():
    """Main function for testing the worker"""
    worker = SerpWorker()
    
    # Test with a sample keyword
    test_keyword = "AI blog writing tools"
    test_org_id = "550e8400-e29b-41d4-a716-446655440000"  # Sample UUID
    
    try:
        result = await worker.process_keyword(test_keyword, test_org_id)
        print(f"Processed keyword: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
