# Project Plan — AI-Powered Blog Writer

## Current Goal
Ship an MVP: **“Seed keyword → generate outline → full draft with citations + images → QA checks → publish to WordPress”**.  
Covers research, outline, draft, QA, and publishing for one connected site.

## Next 3 Tasks
1. Scaffold monorepo (Next.js FE, NestJS API, Python workers, Postgres/Redis/S3 infra).
2. Define contracts (Zod/Pydantic) and migrations for orgs, sites, projects, keywords, posts, outlines, drafts, QA, publishes.
3. Implement vertical slice: keyword discovery → outline → draft → QA → publish (WordPress sandbox).

## Coding Plan 


- Monorepo, `.cursor/rules`, CI, docker-compose for Postgres+pgvector, Redis, NATS, MinIO.

- Zod/Pydantic schemas; NestJS OpenAPI stubs; Postgres migrations (orgs → posts → publishes).

- serp-worker (SERP snapshot via API); cluster-worker (topic groups); keyword & cluster tables.

- outline-worker: structure H1–H3 with word counts.  
- draft-worker: LLM+RAG; citations; images (AI/stock) with alt text.
 
- seo-worker: title/meta checks, TF-IDF/entity coverage, schema JSON-LD, internal link suggestions.

- publish-worker: WP API connector (posts + media).  
- Optional: Medium/Ghost connectors.
  
- metrics-worker: GA4 + GSC pull; analytics dashboards; refresh prompts.
 
- Comments, versions, content calendar, approval workflow.
  
- Stripe seats+usage billing; OTEL metrics/traces; Sentry errors.
 
- Security audit, HIPAA/DSR compliance, load/chaos tests, prod deploy.

## Success Criteria
- **Product:** Time-to-draft ≤ 2 min median; QA first-pass ≥ 70%; publish success ≥ 99%; refresh campaigns drive +20% clicks in 30 days.
- **Engineering:** Draft pipeline success ≥ 99.5%; image pipeline failures < 1%; API 5xx < 0.5%/1k; analytics SLA met 99% of days.
- **UX:** Outline in <10s p95; 1.2k-word draft <35s p95; QA <8s p95.
