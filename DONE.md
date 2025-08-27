# Completed Tasks — AI-Powered Blog Writer

## Phase 1 — Repo & Infra

[2024-01-27] [Cursor] Monorepo setup: apps/frontend (Next.js), apps/gateway (NestJS), apps/workers (Python), packages/contracts, packages/sdk-js
[2024-01-27] [Cursor] Add PLAN.md, TODO.md, ARCH.md, DECISIONS.log, DONE.md
[2024-01-27] [Cursor] GitHub Actions: lint, typecheck, tests, docker build, scan
[2024-01-27] [Cursor] docker-compose: Postgres 16 (+pgvector), Redis, NATS, MinIO
[2024-01-27] [Cursor] `.env.example` with DB/Redis/S3/LLM keys
[2024-01-27] [Cursor] Define schemas: orgs, users, sites, projects, keywords, clusters, posts, outlines, drafts, qa_checks, internal_links, publishes, analytics, comments, versions
[2024-01-27] [Cursor] Generate NestJS OpenAPI spec `/v1`
[2024-01-27] [Cursor] Postgres migrations + RLS policies
[2024-01-27] [Cursor] SDK-JS stubs: posts, outline, draft, QA, publish, analytics
[2024-01-27] [Cursor] serp-worker: fetch SERP snapshot (titles, H1s, FAQ, entities)
[2024-01-27] [Cursor] cluster-worker: embed + cluster terms; persist clusters
[2024-01-27] [Cursor] UI: KeywordDiscover + SERPSnapshot + ClusterPlanner
[2024-01-27] [Cursor] outline-worker: generate H1–H3 structure + word counts
[2024-01-27] [Cursor] draft-worker: LLM+RAG from supplied sources; citations; tone/audience control
[2024-01-27] [Cursor] image-worker: AI/stock search; resize/compress; alt text gen
[2024-01-27] [Cursor] UI: OutlineComposer, MDXEditor, ImagePicker
[2024-01-27] [Cursor] seo-worker: on-page checks (title/meta/slug/links/readability/schema)
[2024-01-27] [Cursor] Internal link suggester from sitemap/site index
[2024-01-27] [Cursor] UI: QAPanel, InternalLinks, SchemaEditor
[2024-01-27] [Cursor] publish-worker: WordPress API (posts + media)
[2024-01-27] [Cursor] Connectors: Medium, Ghost
[2024-01-27] [Cursor] UI: PublishPanel (status, schedule, dry-run)
[2024-01-27] [Cursor] metrics-worker: pull GA4/GSC nightly; store in analytics
[2024-01-27] [Cursor] UI: AnalyticsDash (pageviews, CTR, impressions, trends)
[2024-01-27] [Cursor] Content refresh prompts (traffic drop detection)
[2024-01-27] [Cursor] Comments, versions, audit log
[2024-01-27] [Cursor] ContentCalendar component (kanban + calendar views)
[2024-01-27] [Cursor] Roles & approvals workflow
[2024-01-27] [Cursor] Stripe: seats + usage minutes billing
[2024-01-27] [Cursor] OTEL traces; Prometheus/Grafana dashboards
[2024-01-27] [Cursor] Sentry worker/API exceptions
[2024-01-27] [Cursor] Load & chaos tests
[2024-01-27] [Cursor] Security pass: RLS, signed URLs, dependency scans
[2024-01-27] [Cursor] Retention & copyright compliance
[2024-01-27] [Cursor] Prod deploy: Vercel (FE), Fly/Render/GKE (API/workers)
