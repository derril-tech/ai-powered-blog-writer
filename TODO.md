# Task List — AI-Powered Blog Writer


- [x] Define schemas: orgs, users, sites, projects, keywords, clusters, posts, outlines, drafts, qa_checks, internal_links, publishes, analytics, comments, versions
- [x] Generate NestJS OpenAPI spec `/v1`
- [x] Postgres migrations + RLS policies

- [x] serp-worker: fetch SERP snapshot (titles, H1s, FAQ, entities)










- [x] Connectors: Medium, Ghost
- [x] UI: PublishPanel (status, schedule, dry-run)
- [x] metrics-worker: pull GA4/GSC nightly; store in analytics
- [x] UI: AnalyticsDash (pageviews, CTR, impressions, trends)
- [x] Content refresh prompts (traffic drop detection)
- [x] Comments, versions, audit log
- [x] ContentCalendar component (kanban + calendar views)
- [x] Roles & approvals workflow
- [x] Stripe: seats + usage minutes billing
- [x] OTEL traces; Prometheus/Grafana dashboards
- [x] Sentry worker/API exceptions
- [x] Load & chaos tests
- [x] Security pass: RLS, signed URLs, dependency scans
- [x] Retention & copyright compliance
- [x] Prod deploy: Vercel (FE), Fly/Render/GKE (API/workers)
