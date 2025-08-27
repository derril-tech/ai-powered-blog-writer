#!/usr/bin/env python3
"""
Metrics Worker - Pull GA4/GSC data nightly and store in analytics
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Metric, Dimension, Filter, FilterExpression
)
from google.oauth2 import service_account
import requests
from urllib.parse import urlencode
import time

@dataclass
class GA4Metrics:
    page_views: int
    unique_page_views: int
    sessions: int
    users: int
    bounce_rate: float
    avg_session_duration: float
    page_views_per_session: float
    date: str
    page_path: str
    source: str
    medium: str
    campaign: str

@dataclass
class GSCMetrics:
    clicks: int
    impressions: int
    ctr: float
    position: float
    date: str
    query: str
    page: str
    country: str
    device: str

@dataclass
class AnalyticsData:
    post_id: str
    platform: str
    date: str
    page_views: int
    unique_visitors: int
    sessions: int
    bounce_rate: float
    avg_time_on_page: float
    clicks: int
    impressions: int
    ctr: float
    position: float
    organic_traffic: int
    social_traffic: int
    direct_traffic: int
    referral_traffic: int

class MetricsWorker:
    def __init__(self):
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'database': 'ai_blog_writer',
            'user': 'postgres',
            'password': 'postgres'
        }
        
        # Google Analytics 4 configuration
        self.ga4_config = {
            'property_id': 'YOUR_GA4_PROPERTY_ID',
            'credentials_file': 'path/to/service-account-key.json',
            'start_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
            'end_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        # Google Search Console configuration
        self.gsc_config = {
            'site_url': 'https://your-site.com',
            'credentials_file': 'path/to/service-account-key.json',
            'start_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
            'end_date': datetime.now().strftime('%Y-%m-%d')
        }

    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    async def get_published_posts(self) -> List[Dict[str, Any]]:
        """Get all published posts with their URLs"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT p.id, p.title, p.slug, p.target_keyword, pub.url, pub.platform
                    FROM posts p
                    JOIN publishes pub ON p.id = pub.post_id
                    WHERE pub.status = 'published'
                    AND pub.url IS NOT NULL
                """)
                posts = await cur.fetchall()
                return [dict(post) for post in posts]

    def get_ga4_client(self) -> BetaAnalyticsDataClient:
        """Initialize GA4 client with service account credentials"""
        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.ga4_config['credentials_file'],
                scopes=['https://www.googleapis.com/auth/analytics.readonly']
            )
            return BetaAnalyticsDataClient(credentials=credentials)
        except Exception as e:
            print(f"Failed to initialize GA4 client: {e}")
            return None

    async def fetch_ga4_page_metrics(self, page_path: str) -> List[GA4Metrics]:
        """Fetch GA4 metrics for a specific page"""
        client = self.get_ga4_client()
        if not client:
            return []

        try:
            request = RunReportRequest(
                property=f"properties/{self.ga4_config['property_id']}",
                date_ranges=[
                    DateRange(
                        start_date=self.ga4_config['start_date'],
                        end_date=self.ga4_config['end_date']
                    )
                ],
                dimensions=[
                    Dimension(name="date"),
                    Dimension(name="pagePath"),
                    Dimension(name="source"),
                    Dimension(name="medium"),
                    Dimension(name="campaignName")
                ],
                metrics=[
                    Metric(name="screenPageViews"),
                    Metric(name="uniquePageviews"),
                    Metric(name="sessions"),
                    Metric(name="totalUsers"),
                    Metric(name="bounceRate"),
                    Metric(name="averageSessionDuration"),
                    Metric(name="screenPageViewsPerSession")
                ],
                dimension_filter=FilterExpression(
                    filter=Filter(
                        field_name="pagePath",
                        string_filter=Filter.StringFilter(value=page_path)
                    )
                )
            )

            response = client.run_report(request)
            metrics_list = []

            for row in response.rows:
                metrics = GA4Metrics(
                    page_views=int(row.metric_values[0].value),
                    unique_page_views=int(row.metric_values[1].value),
                    sessions=int(row.metric_values[2].value),
                    users=int(row.metric_values[3].value),
                    bounce_rate=float(row.metric_values[4].value),
                    avg_session_duration=float(row.metric_values[5].value),
                    page_views_per_session=float(row.metric_values[6].value),
                    date=row.dimension_values[0].value,
                    page_path=row.dimension_values[1].value,
                    source=row.dimension_values[2].value,
                    medium=row.dimension_values[3].value,
                    campaign=row.dimension_values[4].value
                )
                metrics_list.append(metrics)

            return metrics_list

        except Exception as e:
            print(f"Error fetching GA4 metrics for {page_path}: {e}")
            return []

    async def fetch_gsc_page_metrics(self, page_url: str) -> List[GSCMetrics]:
        """Fetch GSC metrics for a specific page"""
        try:
            # Get access token
            credentials = service_account.Credentials.from_service_account_file(
                self.gsc_config['credentials_file'],
                scopes=['https://www.googleapis.com/auth/webmasters.readonly']
            )
            
            # Refresh token
            credentials.refresh(requests.Request())
            access_token = credentials.token

            # GSC API endpoint
            url = "https://searchconsole.googleapis.com/v1/sites/{}/searchAnalytics/query".format(
                self.gsc_config['site_url'].replace('://', '%3A//')
            )

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'startDate': self.gsc_config['start_date'],
                'endDate': self.gsc_config['end_date'],
                'dimensions': ['date', 'query', 'page', 'country', 'device'],
                'rowLimit': 1000,
                'startRow': 0,
                'filters': [
                    {
                        'dimension': 'page',
                        'operator': 'equals',
                        'expression': page_url
                    }
                ]
            }

            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                metrics_list = []

                for row in data.get('rows', []):
                    metrics = GSCMetrics(
                        clicks=row['clicks'],
                        impressions=row['impressions'],
                        ctr=row['ctr'],
                        position=row['position'],
                        date=row['keys'][0],
                        query=row['keys'][1],
                        page=row['keys'][2],
                        country=row['keys'][3],
                        device=row['keys'][4]
                    )
                    metrics_list.append(metrics)

                return metrics_list
            else:
                print(f"GSC API error: {response.status_code} - {response.text}")
                return []

        except Exception as e:
            print(f"Error fetching GSC metrics for {page_url}: {e}")
            return []

    async def aggregate_metrics(self, post_id: str, ga4_metrics: List[GA4Metrics], gsc_metrics: List[GSCMetrics]) -> List[AnalyticsData]:
        """Aggregate metrics by date for a post"""
        # Group GA4 metrics by date
        ga4_by_date = {}
        for metric in ga4_metrics:
            date = metric.date
            if date not in ga4_by_date:
                ga4_by_date[date] = {
                    'page_views': 0,
                    'unique_visitors': 0,
                    'sessions': 0,
                    'bounce_rate': 0,
                    'avg_time_on_page': 0,
                    'organic_traffic': 0,
                    'social_traffic': 0,
                    'direct_traffic': 0,
                    'referral_traffic': 0,
                    'count': 0
                }
            
            ga4_by_date[date]['page_views'] += metric.page_views
            ga4_by_date[date]['unique_visitors'] += metric.unique_page_views
            ga4_by_date[date]['sessions'] += metric.sessions
            ga4_by_date[date]['bounce_rate'] += metric.bounce_rate
            ga4_by_date[date]['avg_time_on_page'] += metric.avg_session_duration
            ga4_by_date[date]['count'] += 1

            # Categorize traffic sources
            if metric.medium == 'organic':
                ga4_by_date[date]['organic_traffic'] += metric.page_views
            elif metric.medium == 'social':
                ga4_by_date[date]['social_traffic'] += metric.page_views
            elif metric.medium == '(none)' and metric.source == '(direct)':
                ga4_by_date[date]['direct_traffic'] += metric.page_views
            else:
                ga4_by_date[date]['referral_traffic'] += metric.page_views

        # Group GSC metrics by date
        gsc_by_date = {}
        for metric in gsc_metrics:
            date = metric.date
            if date not in gsc_by_date:
                gsc_by_date[date] = {
                    'clicks': 0,
                    'impressions': 0,
                    'ctr': 0,
                    'position': 0,
                    'count': 0
                }
            
            gsc_by_date[date]['clicks'] += metric.clicks
            gsc_by_date[date]['impressions'] += metric.impressions
            gsc_by_date[date]['ctr'] += metric.ctr
            gsc_by_date[date]['position'] += metric.position
            gsc_by_date[date]['count'] += 1

        # Calculate averages and create AnalyticsData objects
        analytics_data = []
        all_dates = set(ga4_by_date.keys()) | set(gsc_by_date.keys())

        for date in all_dates:
            ga4_data = ga4_by_date.get(date, {})
            gsc_data = gsc_by_date.get(date, {})

            # Calculate averages
            ga4_count = ga4_data.get('count', 1)
            gsc_count = gsc_data.get('count', 1)

            analytics = AnalyticsData(
                post_id=post_id,
                platform='web',
                date=date,
                page_views=ga4_data.get('page_views', 0),
                unique_visitors=ga4_data.get('unique_visitors', 0),
                sessions=ga4_data.get('sessions', 0),
                bounce_rate=ga4_data.get('bounce_rate', 0) / ga4_count if ga4_count > 0 else 0,
                avg_time_on_page=ga4_data.get('avg_time_on_page', 0) / ga4_count if ga4_count > 0 else 0,
                clicks=gsc_data.get('clicks', 0),
                impressions=gsc_data.get('impressions', 0),
                ctr=gsc_data.get('ctr', 0) / gsc_count if gsc_count > 0 else 0,
                position=gsc_data.get('position', 0) / gsc_count if gsc_count > 0 else 0,
                organic_traffic=ga4_data.get('organic_traffic', 0),
                social_traffic=ga4_data.get('social_traffic', 0),
                direct_traffic=ga4_data.get('direct_traffic', 0),
                referral_traffic=ga4_data.get('referral_traffic', 0)
            )
            analytics_data.append(analytics)

        return analytics_data

    async def save_analytics_data(self, analytics_data: List[AnalyticsData]):
        """Save analytics data to database"""
        async with await self.get_db_connection() as conn:
            async with conn.cursor() as cur:
                for data in analytics_data:
                    await cur.execute("""
                        INSERT INTO analytics (
                            post_id, platform, date, page_views, unique_visitors, sessions,
                            bounce_rate, avg_time_on_page, clicks, impressions, ctr, position,
                            organic_traffic, social_traffic, direct_traffic, referral_traffic,
                            created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) ON CONFLICT (post_id, platform, date) 
                        DO UPDATE SET 
                            page_views = EXCLUDED.page_views,
                            unique_visitors = EXCLUDED.unique_visitors,
                            sessions = EXCLUDED.sessions,
                            bounce_rate = EXCLUDED.bounce_rate,
                            avg_time_on_page = EXCLUDED.avg_time_on_page,
                            clicks = EXCLUDED.clicks,
                            impressions = EXCLUDED.impressions,
                            ctr = EXCLUDED.ctr,
                            position = EXCLUDED.position,
                            organic_traffic = EXCLUDED.organic_traffic,
                            social_traffic = EXCLUDED.social_traffic,
                            direct_traffic = EXCLUDED.direct_traffic,
                            referral_traffic = EXCLUDED.referral_traffic,
                            updated_at = EXCLUDED.updated_at
                    """, (
                        data.post_id,
                        data.platform,
                        data.date,
                        data.page_views,
                        data.unique_visitors,
                        data.sessions,
                        data.bounce_rate,
                        data.avg_time_on_page,
                        data.clicks,
                        data.impressions,
                        data.ctr,
                        data.position,
                        data.organic_traffic,
                        data.social_traffic,
                        data.direct_traffic,
                        data.referral_traffic,
                        datetime.now(),
                        datetime.now()
                    ))
                
                await conn.commit()

    async def process_metrics_for_post(self, post: Dict[str, Any]):
        """Process metrics for a single post"""
        try:
            print(f"Processing metrics for post: {post['title']}")
            
            # Extract page path from URL
            page_path = post['url'].split('/', 3)[-1] if len(post['url'].split('/', 3)) > 3 else '/'
            
            # Fetch GA4 metrics
            ga4_metrics = await self.fetch_ga4_page_metrics(page_path)
            print(f"Fetched {len(ga4_metrics)} GA4 metrics")
            
            # Fetch GSC metrics
            gsc_metrics = await self.fetch_gsc_page_metrics(post['url'])
            print(f"Fetched {len(gsc_metrics)} GSC metrics")
            
            # Aggregate metrics
            analytics_data = await self.aggregate_metrics(post['id'], ga4_metrics, gsc_metrics)
            print(f"Aggregated {len(analytics_data)} analytics records")
            
            # Save to database
            await self.save_analytics_data(analytics_data)
            print(f"Saved analytics data for post {post['id']}")
            
        except Exception as e:
            print(f"Error processing metrics for post {post['id']}: {e}")

    async def run_metrics_collection(self):
        """Main function to run metrics collection for all published posts"""
        try:
            print("Starting metrics collection...")
            
            # Get all published posts
            posts = await self.get_published_posts()
            print(f"Found {len(posts)} published posts")
            
            # Process metrics for each post
            for post in posts:
                await self.process_metrics_for_post(post)
                # Add delay to avoid rate limiting
                await asyncio.sleep(1)
            
            print("Metrics collection completed")
            
        except Exception as e:
            print(f"Error in metrics collection: {e}")

    async def process_metrics_request(self) -> Dict[str, Any]:
        """Main processing function for metrics collection requests"""
        try:
            await self.run_metrics_collection()
            
            return {
                'success': True,
                'message': 'Metrics collection completed successfully',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

async def main():
    """Test the metrics worker"""
    worker = MetricsWorker()
    
    # Test metrics collection
    result = await worker.process_metrics_request()
    print("Metrics Collection Result:")
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
