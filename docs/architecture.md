# Architecture

## Scope

This document records the decisions implemented in StickerTrack Phases 1
through 6. Official catalog, external enrichment, and donation behavior remain
outside the current modules.

## Monorepo

The repository uses pnpm workspaces and Turborepo:

- `apps/web` owns browser rendering and localized user-facing text.
- `apps/api` owns authentication, authorization, validation, and persistence
  orchestration.
- `packages/database` owns the Prisma schema, migrations, seed, and client.
- `packages/shared` owns stable cross-application constants and types.

Internal packages are built during `postinstall` so NestJS and Next.js can
resolve their JavaScript and declaration outputs in development and CI.

## Frontend

Next.js uses the App Router with an explicit `[locale]` segment. `next-intl`
provides server and client translations, localized navigation, request locale
resolution, and translated metadata.

No visible component text is hardcoded. Translation catalogs are stored in:

```text
apps/web/messages/pt-BR.json
apps/web/messages/en.json
apps/web/messages/es.json
```

The validation script treats `pt-BR` as the structural reference and verifies
that all catalogs have identical keys and placeholders.

The language selector replaces only the first pathname segment, preserves the
query string, writes the `NEXT_LOCALE` cookie, and synchronizes the account
preference when an access token is present.

## API

NestJS is split into focused modules:

- `PrismaModule` provides one shared Prisma client.
- `AuthModule` handles registration, login, JWT validation, and current user.
- `UsersModule` handles user preferences.
- `CollectionsModule` provides authenticated, read-only access to published
  collections, sections, stickers, and player data.
- `AdminModule` provides role-protected catalog mutations.
- `UserCollectionsModule` manages personal quantities and progress.
- `ScansModule` resolves manual and camera OCR candidates and confirms results.

The API prefix is `/api/v1`. Swagger is exposed outside that prefix at
`/api/docs`.

Passwords use Argon2. JWT access tokens are stateless and short-lived according
to `JWT_EXPIRES_IN_SECONDS`. Refresh tokens are intentionally deferred.

The API sends stable machine-readable error codes. English backend messages are
diagnostic fallbacks; user-facing translations belong to the frontend.

## Internationalization

Supported locales are centralized in `@sticker-track/shared`:

```text
pt-BR
en
es
```

The database enum uses stable technical values:

```text
PT_BR
EN
ES
```

Mapping between URL values and database values occurs at API boundaries.
Player names, sticker codes, external IDs, and enums are never translated.

Editorial database content uses `CollectionTranslation` and
`CollectionSectionTranslation`. This avoids tying imported or administrated
collections to one language while preserving factual fields on their primary
entities.

## Data model

The initial schema includes:

- `User`
- `Collection`
- `CollectionTranslation`
- `CollectionSection`
- `CollectionSectionTranslation`
- `Sticker`
- `Player`
- `PlayerImage`
- `UserCollection`
- `UserSticker`
- `StickerScan`

Important unique constraints protect collection codes, user collection
membership, quantities per sticker, ordering, and one translation per locale.

The schema includes future domain entities because they establish data
ownership and constraints. Catalog queries always include
`isPublished: true`, so draft collections remain unavailable even when their
slug or ID is known.

`StickerScan` belongs to a user, catalog collection, and personal collection.
The direct personal collection relation makes authorization and history
queries explicit. A confirmed scan stores `confirmedAt`; no image or binary
payload is stored.

## Catalog queries

Filtering and pagination are executed in PostgreSQL through Prisma. Search
covers original code, normalized code, sticker name, and player name. The API
returns localized editorial fields and stable technical enum values; the
frontend translates enum labels.

The browser stores catalog filters in the localized URL query string. Changing
locale preserves the pathname and query string.

## Catalog administration

Catalog writes require both JWT authentication and the `ADMIN` role. The
administrative surface is intentionally API-first and documented through
Swagger in Phase 3.

## CSV import

The importer parses CSV structurally, validates the complete file before any
write, normalizes sticker codes through the shared domain function, and
applies valid imports in a Prisma transaction. `--dry-run` performs all
validation and reports results without opening a write transaction.

## Seed policy

The seed contains one published 30-sticker fictional collection, one
unpublished collection, four localized sections, varied sticker types, and
invented players. It must not be replaced with guessed official data.

## Code scanning

Code normalization lives in `@sticker-track/shared` and is used by imports,
catalog lookup, personal collection search, and scan resolution. It separates
an alphabetic prefix from a numeric suffix, removes separators and leading
zeros, and respects collection-specific length limits.

Safe contextual corrections only occur after the input has an explicit prefix
and number boundary. Ambiguous corrections produce candidates rather than a
silent choice.

The scan workflow has two API operations:

1. `resolve` validates personal collection ownership, records the attempt, and
   returns a result without changing quantity.
2. `confirm` claims the pending scan with an atomic conditional update and
   increments `UserSticker` in the same transaction.

The conditional claim is the idempotency boundary. Concurrent confirmation
requests for one scan result in one successful increment and one
`SCAN_ALREADY_CONFIRMED` response.

### Camera lifecycle

`CameraSession` owns one browser `MediaStream`, requests the environment-facing
camera after a clear user action, enumerates video inputs after permission,
and stops every track before switching devices or leaving camera mode. The UI
also stops the session on unmount, cancellation, capture, and interruption.

The preview uses `autoPlay`, `playsInline`, and `muted`. Production camera
access requires HTTPS. Unsupported, insecure, denied, missing, busy, and
generic failure states preserve the manual fallback.

### Local frame processing

`CameraFrameCapture` crops the active proportional guide before considering a
full sensor-frame fallback. It bounds output dimensions and applies
independently testable grayscale, contrast, and threshold operations on a
canvas. The in-memory PNG `Blob` is passed only to the local OCR provider and
is not persisted.

The real-code correction replaces the original central-only crop with
collection-scoped proportional configuration. The demonstration collection
uses an upper-right region at `0.54, 0.05, 0.42, 0.16`. A registry keyed by
collection slug provides an explicit extension point for future layouts
without adding official catalog data.

One video frame is frozen before processing and camera tracks are stopped
immediately. The pipeline evaluates smaller regions before the full-frame
fallback. Each region is enlarged between 2x and 4x and produces original,
grayscale, contrast, threshold, and inverted-threshold variants.
The full-frame fallback is capped at 1800 by 1200 and is never enlarged, which
prevents the last-resort path from creating oversized mobile canvases.

The preview and crop use the same normalized region. `PreviewGeometry` maps
that region through `object-fit: cover` offsets and scale into natural frame
coordinates, avoiding the common error where the guide and canvas crop refer
to different pixels. Portrait, landscape, cover, contain, and right-angle
rotation calculations have focused unit coverage. Manual framing uses the
same mapping and lets the user move and resize the guide.

### OCR provider

The web application depends on `OcrProvider`, not Tesseract directly.
`TesseractOcrProvider` dynamically imports Tesseract.js, creates the English
worker on first capture, reuses it for the scanner session, reports progress,
and terminates it on disposal. `MockOcrProvider` supports deterministic tests.

The primary crop is recognized with Tesseract page segmentation modes
`SINGLE_LINE`, `SINGLE_WORD`, and `SPARSE_TEXT`. Fallback crops use
`SINGLE_LINE`. A strict character whitelist limits noise before shared-domain
candidate extraction.

Worker code, WebAssembly core, and English trained data are deferred from the
main application bundle. First recognition may take several seconds and uses
materially more memory on mobile devices; later runs normally use browser
caches.

### Candidate authority and privacy

The client extracts short candidates using collection-specific limits and
records contextual OCR corrections. The API accepts at most ten bounded
candidates, normalizes every value again, checks only the requested published
collection, and returns catalog matches. Multiple matches require selection.

Candidate validation has a read-only endpoint that does not create scan
history. This allows the local multi-region pipeline to stop when one
sufficiently confident catalog match is found. Final candidates are ordered by
catalog existence, OCR confidence, correction count, and region specificity.
Candidate extraction also receives the distinct prefixes present in the
collection, so unrelated words such as event titles cannot become codes.
It may conservatively recover a prefix when OCR keeps only its final letter,
but only from known collection prefixes and only before read-only catalog
validation.

Raw OCR output is never treated as manual input. No-text and no-candidate
outcomes stop in the browser as `OCR_NO_TEXT_DETECTED` and
`OCR_NO_CODE_CANDIDATE`. API resolution reports `STICKER_CODE_INVALID`,
`STICKER_CODE_NOT_FOUND`, or `MATCHED`.

`StickerScan` stores `ScanSource`, optional confidence, raw OCR text, selected
candidate, corrections, and final status. There is no image field in the DTO
or schema. Frames are never sent to the API, external services, localStorage,
IndexedDB, or PostgreSQL.

### Development diagnostics

`NEXT_PUBLIC_SCANNER_DEBUG=true` enables diagnostics only when
`NODE_ENV=development`. The panel displays the frame and crop geometry,
temporary previews, OCR output, confidence, extracted candidates, correction
metadata, validation matches, and final resolution response. It also renders
the full frame with the effective natural-frame crop highlighted and offers
downloads for the highlighted frame and every processed crop.

Development also exposes local image selection. Files are decoded and
processed in browser memory through the same pipeline as a frozen camera
frame. Neither the file nor generated variants are uploaded or persisted.

## Deployment

Docker Compose provides PostgreSQL, API, and web services. The API container
applies committed migrations before startup. Seed execution remains explicit
to prevent demonstration data from entering production unintentionally.

## Phase 7 catalog and enrichment

`CatalogImportService` parses administrator-provided CSV as inert text,
validates exact headers and every row, detects normalized-code and order
collisions, and builds a deterministic import plan. Validation and dry-run use
read-only queries. Execute repeats validation and applies the plan in a single
transaction. `CatalogImport` stores only completed execution reports; uploaded
CSV content is not persisted.

Player deduplication uses `wikidataId`, then exact `normalizedName +
countryCode`. Approximate names never merge automatically. `Sticker.playerId`
remains nullable, and the internal sticker table remains the sole authority
for code-to-player association.

`PlayerDataProvider` isolates external schemas. `WikidataPlayerProvider` uses
`wbsearchentities`, `wbgetentities`, and Commons `imageinfo`. `ProviderCache`
stores bounded search/detail responses with expiry and request timestamps.
Provider access is administrative, timed out, retried at most once for rate
limiting, and never occurs during public page loads.

`PlayerImage.reviewStatus` gates publication. Public queries filter for
`APPROVED` images before mapping DTOs. Approval requires complete source and
attribution metadata, preventing pending, rejected, unlicensed, or source-less
images from leaking through catalog, scanner, or personal collection views.

All Phase 7 controllers inherit JWT and `ADMIN` guards. DTOs limit field sizes,
validate UUIDs and enums, restrict external URLs to HTTPS, and reject
spreadsheet formula prefixes in imported cells.

## Phase 8 optional project support

`supportConfig` is the only module that reads
`NEXT_PUBLIC_BUY_ME_A_COFFEE_URL`. It trims and parses the value, accepts only
HTTPS, and exposes either a normalized URL or `null`. Invalid configuration is
non-fatal and produces a development-only warning.

`SupportProjectButton` renders a standard accessible anchor with a new-tab
target and `noopener noreferrer`. It does not load third-party code or make a
network request before user interaction. `SupportProjectCard` reuses this
behavior in the footer and profile, while the localized support page explains
voluntary support, lack of benefits, and project independence.

The footer callout is route-aware and returns `null` on scanner, login, and
registration routes. Without a valid URL, footer and profile calls to action
are absent; the support page remains available with a localized configuration
notice.

Docker passes the public URL as a web build argument because Next.js embeds
`NEXT_PUBLIC_*` values into the client bundle during production builds.

## Deferred decisions

- Refresh token storage and rotation
- HTTP-only authentication cookies
- Live sequential camera scanning
- First-party payments, subscriptions, and supporter benefits
# Production runtime

The public runtime is split into a stateless Next.js frontend and stateless NestJS API backed by persistent PostgreSQL. HTTPS terminates at the managed edge or VPS reverse proxy. The API performs strict startup configuration validation, emits request-correlated structured logs, and exposes separate liveness and readiness probes.

User-uploaded scanner images stay in the browser. CSV imports are parsed in memory within configured byte and row limits and are not retained. Approved player images remain remote Wikimedia resources with attribution and host restrictions.
