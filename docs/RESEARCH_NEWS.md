# PRPDN Research News

## Scope and activation

Public `/news/`, six curated homepage cards, and `/admin/news/` share one article representation. Articles are plain-text metadata linking to the original BRIN publication; this is not a full-text mirror. Categories and excerpts are PRPDN editorial classifications/summaries. Dates, titles and photographs were verified on the linked official pages on 21 October 2026. `src/data/news.json` records all six source and image URLs.

The new migration is **additive SQL only**: `prisma/migrations/202610210001_research_news/migration.sql`. It creates `NewsSource` and `NewsArticle`. It does not change existing tables, insert articles, reset, or seed data. Prisma Client generation and schema diff generation do not apply this migration.

Production steps require a separate explicit review:

1. Review the SQL, the existing migration history and the normal backup/recovery procedure.
2. An authorized operator applies the reviewed migration through the existing Prisma deployment procedure. No migration has been executed by this implementation.
3. Set `PRPDN_NEWS_DATABASE_ENABLED=true` in the intended environment after migration. This implementation does not edit environment files or production configuration.
4. Open News CMS as Administrator or Super Admin and explicitly choose **Tambahkan katalog awal**, or create articles manually. Initial catalog insertion is transactional and deduplicates canonical URLs. Existing editorial changes, unpublished status, and featured choices are never overwritten by catalog insertion.

Without the flag the public site displays the six verified curated links with an explicit catalog notice. CMS writes are unavailable. With the flag enabled, database failures show an honest unavailable state rather than resurrecting static articles that editors may have unpublished. Before the first editorial action, the catalog is still available; the first catalog import/article save marks it as initialized. Thereafter an empty publication set stays empty, even after permanent deletion.

## Permissions and security

Server-side session validation requires an active approved Better Auth user. Administrator and Super Admin can list, create, edit, publish/unpublish, feature/unfeature, and preview. Only Super Admin can permanently delete, configure the BRIN source, or request synchronization. News permissions are fixed role boundaries, not client-supplied capabilities. The sidebar follows those same role boundaries.

All mutations enforce the existing same-origin check and JSON size/type validation. Article fields use strict Zod validation, plain text only, an ISO source publication date, and HTTPS URLs on an exact BRIN host allowlist. Canonical article URLs normalize www/non-www, tracking query strings, fragments and trailing slashes. A database unique index enforces deduplication. Image URLs permit only `brin.go.id`, `www.brin.go.id`, and `miniox.brin.go.id`; the application server never fetches submitted URLs. Photos are displayed directly from the official host with attribution, lazy loading, and a missing-image state. No arbitrary HTML is rendered.

Edits/deletions require the displayed version to prevent overwriting concurrent work. Writes and source configuration changes create audit records transactionally. Permanent deletion has an explicit confirmation and is distinct from unpublishing. No article content is written to application logs.

## Synchronization is deliberately unavailable

The official BRIN news pages and public documentation were inspected. No authorized, documented general news RSS/API suitable for automatic republication was verified. Public website internals are not treated as permission to scrape. No recurring scraper, cron job, external feed fetching, or scheduled endpoint is installed. The Super Admin synchronization endpoint checks authentication/role/origin and returns a clear `409` explaining this limitation.

Source name and permission notes can be configured. Editing notes cannot turn on automatic synchronization or supply an arbitrary fetch target. `feedUrl`, `syncEnabled`, `originalMetadata`, and `editorialOverride` preserve the minimum metadata needed for a future approved provider; no automatic behavior is claimed.

For a future verified provider, review its documented endpoint, reuse terms and image attribution first. Implement a fixed allowlisted provider, bounded response parsing/timeouts, canonical deduplication, and explicit preservation of editorial overrides/featured flags. Only then add a secret-protected scheduled endpoint and the appropriate Vercel Hobby schedule (no more than one daily invocation under the current plan constraints, recheck official limits before enabling). A secret must be configured by the operator; never commit one.

## Design reference

[Notched Project Card — Maud Benaddi](https://21st.dev/@maudbenaddi/components/notched-project-card). The exact reference page/preview was inspected. The 21st.dev MCP reported 0/2 code retrievals remaining; no code retrieval was retried or claimed. The rounded corner cutout, integrated arrow, editorial photograph and subtle hover treatment were adapted manually to PRPDN's existing navy palette, typography and responsive layout. No dependency was added.

## Verification

Changed files for this feature:

- Public routes/integration: `src/app/(public)/news/page.tsx`, `src/app/(public)/news/loading.tsx`, `src/app/(public)/page.tsx`, `src/components/public/public-shell.tsx`.
- Reusable presentation: `src/components/news/notched-news-card.tsx`, `news-home.tsx`, `news-manager.tsx`, `news.css`.
- Admin route/navigation: `src/app/admin/news/page.tsx`, `src/app/admin/[module]/page.tsx`, `src/lib/navigation.ts`, `src/lib/navigation.test.ts`.
- API/service/validation: `src/app/api/admin/news/[[...path]]/route.ts`, `src/server/services/news.ts`, `src/lib/news.ts`, `src/lib/news.test.ts`.
- Verified catalog: `src/data/news.json`.
- Database review artifacts: `prisma/schema.prisma`, `prisma/migrations/202610210001_research_news/migration.sql`.
- This activation/limitations document. Prior uncommitted authentication/comparison fixes were preserved.

Run `npm run lint`, `npm run typecheck`, `npm run build`, and `node --import tsx --test src/lib/*.test.ts src/components/public/auth-field.test.ts`.

Tests use verified metadata and isolated in-memory database/session mocks; they do not connect to or mutate production data. Real TiDB migration, authenticated CMS persistence, concurrent database transactions and real-account permission flows remain unverified until the reviewed migration and environment activation take place. Automatic synchronization is unavailable, not passed.
