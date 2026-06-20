# Production deployment

## Recommended architecture

Traffic reaches the Next.js frontend over HTTPS. The frontend calls the NestJS API over HTTPS, and the API connects to PostgreSQL using TLS. The API is stateless; persistent data belongs in PostgreSQL.

## Option A: managed services

Use a managed frontend platform, a container or Node hosting service for the API, and managed PostgreSQL. This has lower operational complexity, automatic TLS, easier scaling, and provider-managed backups. Costs vary with traffic, database size, outbound bandwidth, build minutes, and retention. Free tiers commonly sleep, limit CPU, shorten backup retention, and provide no availability guarantee.

Before choosing a provider, compare regional availability, PostgreSQL TLS, point-in-time recovery, log retention, outbound traffic, custom domains, health checks, and data export. The code does not depend on a specific provider.

## Option B: VPS with Docker Compose

Run `docker-compose.yml` together with `docker-compose.production.yml`, place Caddy, Nginx, or an equivalent reverse proxy in front, and keep PostgreSQL on a persistent encrypted volume. This offers predictable control and can cost less at steady low traffic, but patching, firewall rules, backups, restore tests, monitoring, TLS renewal, capacity, and incident response remain the operator's responsibility.

The proxy should redirect HTTP to HTTPS, limit API request bodies to 3 MB, use a longer timeout only for approved OCR/provider operations, compress text responses, avoid caching authenticated API responses, and proxy `/` to port 3000 and the API hostname to port 3001. Camera access requires a secure HTTPS context.

## Release sequence

1. Back up the database and verify the backup artifact.
2. Build immutable API and web images.
3. Run `pnpm deploy:migrate` once with the release database credentials.
4. Start the API and wait for `/health/ready`.
5. Start or replace the frontend.
6. Run localized smoke tests for sign-in, catalog, collection, scanner, password reset, privacy, and terms.

Never use `prisma migrate dev` in production. Existing migration files are immutable. Destructive schema changes require an expand-and-contract release and a tested restore plan.

Deployments upgraded from Phases 1-8 may contain the legacy `_sticker_track_migrations` table. `pnpm deploy:migrate` safely baselines only migration names already recorded in that table before running `prisma migrate deploy`; it refuses unknown legacy migration names.

## Domains and HTTPS

Separate `app.example.com` and `api.example.com` gives clear service boundaries and independent scaling, but requires CORS and two certificates. A single `example.com` with `/api` simplifies same-origin cookies and CORS, but requires proxy routing and coordinated deployments. Set `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, and `CORS_ALLOWED_ORIGINS` consistently.

## Authentication decision

Phase 9 keeps the bearer JWT in browser local storage to avoid changing every authenticated workflow without full browser regression coverage. This is exposed to successful XSS. Mitigations include CSP, short production expiry, session invalidation through `tokenVersion`, strict external hosts, input validation, and no third-party scripts. Before public launch, migrate to an `HttpOnly`, `Secure`, `SameSite=Lax` cookie and add explicit CSRF protection for state-changing requests.

Email verification storage and the provider boundary are prepared, but verification is not enforced. Add verification endpoints as a pre-launch subphase; public catalog access may remain open, while collection mutation, scanner use, and administration should require verification.

## Monitoring

The application runs without an external SDK. Collect JSON API logs and monitor uptime endpoints, p95 latency, HTTP 5xx rate, process memory, container restarts, database connections, OCR resolution failures, and Wikidata failures. Configure alerts outside the repository and redact authorization headers, tokens, OCR text, CSV bodies, and images.

## Human decisions before launch

- Hosting provider, region, domain, and responsible contact address.
- Managed email provider for password reset.
- Backup retention and recovery-point objective.
- Legal review of privacy and terms.
- Cookie-based authentication migration timing.
- Monitoring, alert destination, and incident owner.
