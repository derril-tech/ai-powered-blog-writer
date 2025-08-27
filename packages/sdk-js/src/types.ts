export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'outline' | 'writing' | 'review' | 'published' | 'archived';
  orgId: string;
  projectId?: string;
  siteId?: string;
  authorId: string;
  targetKeyword?: string;
  wordCount: number;
  seoScore?: number;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  title: string;
  projectId?: string;
  siteId?: string;
  targetKeyword?: string;
}

export interface UpdatePostRequest {
  title?: string;
  status?: 'draft' | 'outline' | 'writing' | 'review' | 'published' | 'archived';
  targetKeyword?: string;
}

export interface Outline {
  id: string;
  postId: string;
  structure: Array<{
    level: number;
    title: string;
    wordCount: number;
    content?: string;
  }>;
  totalWords: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  id: string;
  postId: string;
  content: string;
  wordCount: number;
  version: number;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QaCheck {
  id: string;
  postId: string;
  checkType: 'seo' | 'readability' | 'fact_check' | 'grammar' | 'tone';
  status: 'pending' | 'pass' | 'fail' | 'warning';
  score?: number;
  issues: Array<{
    type: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    location?: string;
  }>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Publish {
  id: string;
  postId: string;
  siteId: string;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  publishedUrl?: string;
  publishedAt?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  id: string;
  postId: string;
  publishId?: string;
  date: string;
  pageviews: number;
  uniquePageviews: number;
  sessions: number;
  bounceRate?: number;
  avgTimeOnPage?: number;
  ctr?: number;
  impressions: number;
  clicks: number;
  position?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SdkConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}
