# Created automatically by Cursor AI (2024-01-27)

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

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
class KeywordCluster:
    """Represents a cluster of related keywords"""
    id: str
    name: str
    description: str
    keywords: List[str]
    embedding: Optional[List[float]] = None
    centroid: Optional[List[float]] = None
    size: int = 0
    avg_search_volume: float = 0.0
    avg_difficulty: float = 0.0
    avg_cpc: float = 0.0

class ClusterWorker:
    """Worker for clustering keywords using embeddings and similarity"""
    
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Initialize clustering parameters
        self.min_cluster_size = 3
        self.similarity_threshold = 0.7
        self.max_clusters = 20
        
    async def get_keywords_for_clustering(self, org_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch keywords from database for clustering"""
        try:
            with self.SessionLocal() as session:
                query = text("""
                    SELECT id, term, search_volume, difficulty, cpc, settings
                    FROM keywords 
                    WHERE org_id = :org_id
                    AND (project_id = :project_id OR :project_id IS NULL)
                    AND cluster_id IS NULL
                    ORDER BY search_volume DESC NULLS LAST
                """)
                
                result = session.execute(query, {
                    'org_id': org_id,
                    'project_id': project_id
                })
                
                keywords = []
                for row in result:
                    keyword_data = {
                        'id': row[0],
                        'term': row[1],
                        'search_volume': row[2] or 0,
                        'difficulty': row[3] or 50,
                        'cpc': row[4] or 0.0,
                        'settings': json.loads(row[5]) if row[5] else {}
                    }
                    keywords.append(keyword_data)
                
                return keywords
                
        except Exception as e:
            logger.error(f"Error fetching keywords: {e}")
            raise
    
    def create_embeddings(self, keywords: List[str]) -> np.ndarray:
        """Create TF-IDF embeddings for keywords"""
        try:
            # Use TF-IDF for keyword embeddings
            vectorizer = TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),
                stop_words='english',
                min_df=1
            )
            
            # Create embeddings
            embeddings = vectorizer.fit_transform(keywords)
            
            # Convert to dense array for clustering
            return embeddings.toarray()
            
        except Exception as e:
            logger.error(f"Error creating embeddings: {e}")
            raise
    
    def cluster_keywords(self, keywords: List[Dict[str, Any]], embeddings: np.ndarray) -> List[KeywordCluster]:
        """Cluster keywords using K-means and similarity"""
        try:
            # Determine optimal number of clusters
            n_keywords = len(keywords)
            if n_keywords < self.min_cluster_size:
                logger.info(f"Not enough keywords ({n_keywords}) for clustering")
                return []
            
            # Use elbow method to find optimal k
            max_k = min(self.max_clusters, n_keywords // self.min_cluster_size)
            if max_k < 2:
                max_k = 2
            
            # Try different k values and find optimal
            inertias = []
            k_values = range(2, max_k + 1)
            
            for k in k_values:
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                kmeans.fit(embeddings)
                inertias.append(kmeans.inertia_)
            
            # Find elbow point (simplified)
            optimal_k = self._find_elbow_point(k_values, inertias)
            
            # Perform final clustering
            kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(embeddings)
            
            # Create clusters
            clusters = []
            for i in range(optimal_k):
                cluster_indices = np.where(cluster_labels == i)[0]
                
                if len(cluster_indices) >= self.min_cluster_size:
                    cluster_keywords = [keywords[j] for j in cluster_indices]
                    cluster_embeddings = embeddings[cluster_indices]
                    
                    # Calculate cluster statistics
                    search_volumes = [k['search_volume'] for k in cluster_keywords]
                    difficulties = [k['difficulty'] for k in cluster_keywords]
                    cpcs = [k['cpc'] for k in cluster_keywords]
                    
                    # Create cluster
                    cluster = KeywordCluster(
                        id=f"cluster_{i}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                        name=self._generate_cluster_name(cluster_keywords),
                        description=self._generate_cluster_description(cluster_keywords),
                        keywords=[k['term'] for k in cluster_keywords],
                        centroid=kmeans.cluster_centers_[i].tolist(),
                        size=len(cluster_keywords),
                        avg_search_volume=np.mean(search_volumes),
                        avg_difficulty=np.mean(difficulties),
                        avg_cpc=np.mean(cpcs)
                    )
                    
                    clusters.append(cluster)
            
            return clusters
            
        except Exception as e:
            logger.error(f"Error clustering keywords: {e}")
            raise
    
    def _find_elbow_point(self, k_values: List[int], inertias: List[float]) -> int:
        """Find the elbow point in the inertia curve"""
        if len(inertias) < 3:
            return k_values[0] if k_values else 2
        
        # Simple elbow detection
        diffs = np.diff(inertias)
        diff_diffs = np.diff(diffs)
        
        # Find the point where the rate of change decreases most
        elbow_idx = np.argmin(diff_diffs) + 1
        
        return k_values[elbow_idx]
    
    def _generate_cluster_name(self, keywords: List[Dict[str, Any]]) -> str:
        """Generate a descriptive name for the cluster"""
        terms = [k['term'] for k in keywords]
        
        # Find common words
        all_words = []
        for term in terms:
            words = term.lower().split()
            all_words.extend(words)
        
        # Count word frequencies
        word_counts = {}
        for word in all_words:
            if len(word) > 2:  # Skip short words
                word_counts[word] = word_counts.get(word, 0) + 1
        
        # Get most common words
        common_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        if common_words:
            return f"Cluster: {' '.join([word for word, _ in common_words])}"
        else:
            return f"Cluster: {terms[0]}"
    
    def _generate_cluster_description(self, keywords: List[Dict[str, Any]]) -> str:
        """Generate a description for the cluster"""
        terms = [k['term'] for k in keywords]
        
        if len(terms) <= 3:
            return f"Keywords related to: {', '.join(terms)}"
        else:
            return f"Cluster of {len(terms)} related keywords including: {', '.join(terms[:3])}..."
    
    async def save_clusters(self, clusters: List[KeywordCluster], org_id: str, project_id: Optional[str] = None) -> List[str]:
        """Save clusters to database"""
        try:
            cluster_ids = []
            
            with self.SessionLocal() as session:
                for cluster in clusters:
                    # Insert cluster
                    cluster_query = text("""
                        INSERT INTO clusters (id, name, description, keywords, embedding, org_id, project_id, created_at, updated_at)
                        VALUES (:id, :name, :description, :keywords, :embedding, :org_id, :project_id, NOW(), NOW())
                        RETURNING id
                    """)
                    
                    result = session.execute(cluster_query, {
                        'id': cluster.id,
                        'name': cluster.name,
                        'description': cluster.description,
                        'keywords': cluster.keywords,
                        'embedding': cluster.centroid,
                        'org_id': org_id,
                        'project_id': project_id
                    })
                    
                    cluster_id = result.fetchone()[0]
                    cluster_ids.append(cluster_id)
                    
                    # Update keywords with cluster_id
                    for keyword in cluster.keywords:
                        update_query = text("""
                            UPDATE keywords 
                            SET cluster_id = :cluster_id, updated_at = NOW()
                            WHERE term = :keyword AND org_id = :org_id
                        """)
                        
                        session.execute(update_query, {
                            'cluster_id': cluster_id,
                            'keyword': keyword,
                            'org_id': org_id
                        })
                
                session.commit()
                logger.info(f"Saved {len(clusters)} clusters")
                
            return cluster_ids
            
        except Exception as e:
            logger.error(f"Error saving clusters: {e}")
            raise
    
    async def process_keywords(self, org_id: str, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Main method to process keywords and create clusters"""
        try:
            # Fetch keywords
            keywords = await self.get_keywords_for_clustering(org_id, project_id)
            
            if not keywords:
                return {
                    'clusters_created': 0,
                    'keywords_processed': 0,
                    'clusters': []
                }
            
            logger.info(f"Processing {len(keywords)} keywords for clustering")
            
            # Create embeddings
            keyword_terms = [k['term'] for k in keywords]
            embeddings = self.create_embeddings(keyword_terms)
            
            # Perform clustering
            clusters = self.cluster_keywords(keywords, embeddings)
            
            # Save clusters
            cluster_ids = await self.save_clusters(clusters, org_id, project_id)
            
            return {
                'clusters_created': len(clusters),
                'keywords_processed': len(keywords),
                'clusters': [
                    {
                        'id': cluster.id,
                        'name': cluster.name,
                        'description': cluster.description,
                        'keywords': cluster.keywords,
                        'size': cluster.size,
                        'avg_search_volume': cluster.avg_search_volume,
                        'avg_difficulty': cluster.avg_difficulty,
                        'avg_cpc': cluster.avg_cpc
                    }
                    for cluster in clusters
                ]
            }
            
        except Exception as e:
            logger.error(f"Error processing keywords: {e}")
            raise

async def main():
    """Main function for testing the worker"""
    worker = ClusterWorker()
    
    # Test with a sample org
    test_org_id = "550e8400-e29b-41d4-a716-446655440000"  # Sample UUID
    
    try:
        result = await worker.process_keywords(test_org_id)
        print(f"Clustering result: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
