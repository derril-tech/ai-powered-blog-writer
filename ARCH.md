# Architecture Overview — AI-Powered Blog Writer

## High-Level Topology
- **Frontend:** Next.js 14 (React 18), Vercel deploy; MUI + Tailwind UI; MDX editor with TipTap/Monaco hybrid.
- **API Gateway:** NestJS (Node 20, TS); REST `/v1`; Zod validation; Problem+JSON; RBAC (Casbin); RLS; rate limits; Idempotency-Key; Request-ID (ULID).
- **Workers (Python 3.11 + FastAPI):**
  - serp-worker (SERP snapshot)
  - cluster-worker (topic clustering)
  - outline-worker (H1–H3, word counts)
  - draft-worker (LLM+RAG drafts, citations, images)
  - image-worker (AI/stock fetch, compress, alt text)
  - seo-worker (on-page checks, schema, links)
  - factcheck-worker (claim detection + sources)
  - publish-worker (WP/Medium/Ghost posts)
  - metrics-worker (GA4/GSC pull)
- **Queues/Bus:** NATS or Redis Streams; Celery/RQ orchestrator.
- **Datastores:**
  - Postgres 16 (+pgvector) — source of truth (orgs→posts→publishes)
  - Redis — cache/session/jobs
  - S3/R2 — images/exports
  - Optional OpenSearch — large site map & content search
- **Observability:** OTEL spans; Prometheus/Grafana; Sentry
- **Secrets:** Cloud Secrets Manager/KMS; per-integration tokens
- **Billing:** Stripe seats + usage minutes

## Data Model (Core Tables)
- Identity: `orgs`, `users`, `memberships`, `api_keys`
- Sites/Connectors: `sites`, `media_library`
- Research: `projects`, `keywords`, `clusters`
- Content: `posts`, `outlines`, `drafts`, `qa_checks`, `internal_links`
- Publishing: `publishes`, `analytics`
- Collaboration: `comments`, `versions`
- Governance: `audit_log`

**Invariants:**  
- RLS per org.  
- Post status flows enforced; `outlines.locked` prevents structural changes.  
- QA must pass to publish unless override.  
- Publishes.completed_at only when valid URL stored.  

## API Surface (REST `/v1`)
- **Sites:** `POST /sites`, `POST /sites/:id/connect`, `GET /sites/:id`
- **Research:** `POST /keywords/discover`, `POST /serp/snapshot`, `POST /clusters`
- **Posts:** CRUD + status transitions
- **Outline & Draft:** `POST /posts/:id/outline`, `POST /posts/:id/draft`, `GET /posts/:id/draft`
- **QA & Links:** `POST /posts/:id/qa`, `POST /posts/:id/internal-links/suggest`
- **Publish:** `POST /posts/:id/publish`, `GET /publishes/:id`
- **Analytics:** `GET /posts/:id/analytics`, `POST /analytics/refresh`
- **Collaboration:** `POST /comments`, `POST /versions`
- **Exports:** `GET /posts/:id/export?format=mdx|html|pdf|json`

**Conventions:** Idempotency-Key; Problem+JSON errors; cursor pagination.

## Pipelines
- **Research:** serp-worker (SERP snapshot), cluster-worker (keyword groups)
- **Outline:** outline-worker builds structure
- **Draft:** draft-worker with RAG + citations; image-worker adds images
- **QA:** seo-worker checks coverage, readability, schema, links; factcheck-worker resolves claims
- **Publish:** publish-worker pushes to WP/Medium/Ghost
- **Metrics:** metrics-worker pulls GA4/GSC; analytics update
- **Periodic:** sitemap refresh; embeddings rebuild; preview expiry; refresh prompts

## Realtime
- WS: `post:{id}:progress`, `publish:{id}:status`, `analytics:refresh`
- Presence: editing locks; coauthor awareness

## Caching & Performance
- Redis caches: SERP snapshots, sitemaps, GA4 tokens
- Batch API calls; exponential backoff
- Image CDN for previews; signed URLs for originals

## Observability
- OTEL spans tagged by org, site, post, stage
- Metrics: outline latency, draft time, QA pass rate, publish success, analytics freshness
- Sentry: connector/API failures

## Security & Compliance
- TLS/HSTS/CSP; encryption at rest; signed URLs
- RLS enforced; SSO/SCIM enterprise
- DSR endpoints; retention windows
- Copyright compliance: images tagged/licensed; watermark previews

## Frontend (Next.js + MUI + Tailwind)
- Pages: Dashboard, Projects, Posts (Research→Outline→Draft→QA→Publish), Calendar, Sites, Analytics
- Components: KeywordDiscover, SERPSnapshot, ClusterPlanner, OutlineComposer, MDXEditor, ImagePicker, QAPanel, InternalLinks, SchemaEditor, PublishPanel, ContentCalendar, Comments, AnalyticsDash
- State/Data: TanStack Query; Zustand; URL-synced filters
- Realtime: WS + SSE fallback
- Accessibility: MUI ARIA; keyboard-first editing

## SDKs & Integrations
- SDK-JS: posts CRUD, outline, draft, QA, publish, analytics
- Platform connectors: WordPress, Medium, Ghost
- Analytics connectors: GA4, GSC
- Exports: MDX, HTML, PDF, JSON bundle

## DevOps & CI/CD
- Deploy: Vercel (FE), Fly/Render/GKE (API+workers)
- CI: GitHub Actions → lint, typecheck, test, docker, scan, sign, deploy
- IaC: Terraform modules (DB, Redis, buckets, secrets)
- Envs: dev/staging/prod; regional optional
- SLOs: Outline <10s p95; Draft 1.2k words <35s p95; QA <8s p95; publish success ≥99%
