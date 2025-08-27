import { z } from 'zod';

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const OrgEntitySchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  settings: z.record(z.unknown()).optional(),
});

export const UserEntitySchema = BaseEntitySchema.extend({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  avatar_url: z.string().url().optional(),
  org_id: z.string().uuid(),
});

export const MembershipSchema = BaseEntitySchema.extend({
  user_id: z.string().uuid(),
  org_id: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
});

export const ApiKeySchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(255),
  key_hash: z.string(),
  org_id: z.string().uuid(),
  permissions: z.array(z.string()),
  expires_at: z.date().optional(),
});

// Site and connector schemas
export const SiteSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  org_id: z.string().uuid(),
  connector_type: z.enum(['wordpress', 'medium', 'ghost']),
  connector_config: z.record(z.unknown()),
  is_active: z.boolean().default(true),
});

export const MediaLibrarySchema = BaseEntitySchema.extend({
  filename: z.string().min(1).max(255),
  original_name: z.string().min(1).max(255),
  mime_type: z.string(),
  size: z.number().positive(),
  url: z.string().url(),
  alt_text: z.string().optional(),
  org_id: z.string().uuid(),
  site_id: z.string().uuid().optional(),
});

// Research schemas
export const ProjectSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  org_id: z.string().uuid(),
  settings: z.record(z.unknown()).optional(),
});

export const KeywordSchema = BaseEntitySchema.extend({
  term: z.string().min(1).max(255),
  search_volume: z.number().int().min(0).optional(),
  difficulty: z.number().min(0).max(100).optional(),
  cpc: z.number().min(0).optional(),
  org_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  cluster_id: z.string().uuid().optional(),
});

export const ClusterSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  keywords: z.array(z.string()),
  embedding: z.array(z.number()).optional(),
  org_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
});

// Content schemas
export const PostSchema = BaseEntitySchema.extend({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  status: z.enum(['draft', 'outline', 'writing', 'review', 'published', 'archived']),
  org_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  site_id: z.string().uuid().optional(),
  author_id: z.string().uuid(),
  target_keyword: z.string().optional(),
  word_count: z.number().int().min(0).default(0),
  seo_score: z.number().min(0).max(100).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const OutlineSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  structure: z.array(z.object({
    level: z.number().int().min(1).max(6),
    title: z.string().min(1),
    word_count: z.number().int().min(0),
    content: z.string().optional(),
  })),
  total_words: z.number().int().min(0),
  is_locked: z.boolean().default(false),
});

export const DraftSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  content: z.string(),
  word_count: z.number().int().min(0),
  version: z.number().int().min(1),
  is_current: z.boolean().default(true),
});

export const QaCheckSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  check_type: z.enum(['seo', 'readability', 'fact_check', 'grammar', 'tone']),
  status: z.enum(['pending', 'pass', 'fail', 'warning']),
  score: z.number().min(0).max(100).optional(),
  issues: z.array(z.object({
    type: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
    location: z.string().optional(),
  })),
  metadata: z.record(z.unknown()).optional(),
});

export const InternalLinkSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  source_text: z.string(),
  target_url: z.string().url(),
  anchor_text: z.string(),
  position: z.number().int().min(0),
});

// Publishing schemas
export const PublishSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  site_id: z.string().uuid(),
  status: z.enum(['pending', 'publishing', 'published', 'failed']),
  published_url: z.string().url().optional(),
  published_at: z.date().optional(),
  error_message: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const AnalyticsSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  publish_id: z.string().uuid().optional(),
  date: z.date(),
  pageviews: z.number().int().min(0).default(0),
  unique_pageviews: z.number().int().min(0).default(0),
  sessions: z.number().int().min(0).default(0),
  bounce_rate: z.number().min(0).max(100).optional(),
  avg_time_on_page: z.number().min(0).optional(),
  ctr: z.number().min(0).max(100).optional(),
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  position: z.number().min(0).optional(),
});

// Collaboration schemas
export const CommentSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1),
  parent_id: z.string().uuid().optional(),
  is_resolved: z.boolean().default(false),
});

export const VersionSchema = BaseEntitySchema.extend({
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),
  version_number: z.number().int().min(1),
  changes: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    outline: z.unknown().optional(),
  }),
  message: z.string().optional(),
});

// Governance schemas
export const AuditLogSchema = BaseEntitySchema.extend({
  org_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().uuid().optional(),
  details: z.record(z.unknown()).optional(),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional(),
});

// API request/response schemas
export const CreatePostRequestSchema = z.object({
  title: z.string().min(1).max(255),
  project_id: z.string().uuid().optional(),
  site_id: z.string().uuid().optional(),
  target_keyword: z.string().optional(),
});

export const UpdatePostRequestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'outline', 'writing', 'review', 'published', 'archived']).optional(),
  target_keyword: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const GenerateOutlineRequestSchema = z.object({
  post_id: z.string().uuid(),
  target_word_count: z.number().int().min(100).max(5000).optional(),
  tone: z.enum(['professional', 'casual', 'academic', 'conversational']).optional(),
  audience: z.string().optional(),
});

export const GenerateDraftRequestSchema = z.object({
  post_id: z.string().uuid(),
  sources: z.array(z.string().url()).optional(),
  tone: z.enum(['professional', 'casual', 'academic', 'conversational']).optional(),
  audience: z.string().optional(),
  include_images: z.boolean().default(true),
});

export const PublishRequestSchema = z.object({
  post_id: z.string().uuid(),
  site_id: z.string().uuid(),
  publish_at: z.date().optional(),
  dry_run: z.boolean().default(false),
});

// Export all schemas
export const Schemas = {
  // Base
  BaseEntity: BaseEntitySchema,
  
  // Identity
  Org: OrgEntitySchema,
  User: UserEntitySchema,
  Membership: MembershipSchema,
  ApiKey: ApiKeySchema,
  
  // Sites
  Site: SiteSchema,
  MediaLibrary: MediaLibrarySchema,
  
  // Research
  Project: ProjectSchema,
  Keyword: KeywordSchema,
  Cluster: ClusterSchema,
  
  // Content
  Post: PostSchema,
  Outline: OutlineSchema,
  Draft: DraftSchema,
  QaCheck: QaCheckSchema,
  InternalLink: InternalLinkSchema,
  
  // Publishing
  Publish: PublishSchema,
  Analytics: AnalyticsSchema,
  
  // Collaboration
  Comment: CommentSchema,
  Version: VersionSchema,
  
  // Governance
  AuditLog: AuditLogSchema,
  
  // API
  CreatePostRequest: CreatePostRequestSchema,
  UpdatePostRequest: UpdatePostRequestSchema,
  GenerateOutlineRequest: GenerateOutlineRequestSchema,
  GenerateDraftRequest: GenerateDraftRequestSchema,
  PublishRequest: PublishRequestSchema,
};
