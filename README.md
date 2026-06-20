# StickerTrack

StickerTrack is an independent, multilingual web application for managing
sticker and collectible collections. This repository currently implements
Phases 1 through 8: setup, internationalization, authentication, catalog,
personal collection tracking, manual and camera scanning, catalog enrichment,
and optional project support.

The project does not contain official catalogs, logos, stored scans, cloud
OCR, payment processing, subscriptions, or paid features.

## Stack

- pnpm workspaces and Turborepo
- Next.js 15 with App Router and `next-intl`
- NestJS 11 with JWT authentication and Swagger
- PostgreSQL 17 and Prisma 6
- TypeScript, Tailwind CSS, React Hook Form, and Zod
- Tesseract.js 7 for on-device browser OCR
- Docker Compose

## Repository structure

```text
apps/
  api/       NestJS API
  web/       Next.js frontend
packages/
  database/  Prisma schema, migration, seed, and generated client
  shared/    Shared locales and API error codes
docs/
  architecture.md
```

## Requirements

- Node.js 22+
- pnpm 10+
- Docker Desktop for the containerized PostgreSQL workflow

## Environment

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Replace `JWT_SECRET` with a long random value before using the API outside
local development.

Optional project support is configured with:

```env
NEXT_PUBLIC_BUY_ME_A_COFFEE_URL=https://buymeacoffee.com/your-page
```

The support UI remains hidden when this value is empty or invalid. Only valid
HTTPS URLs are accepted.

## Local development

Install dependencies once:

```powershell
pnpm install
```

Then start everything from the repository root with one command:

```powershell
pnpm dev
```

This command:

1. Creates `.env` from `.env.example` when needed.
2. Starts PostgreSQL with Docker Compose.
3. Waits for PostgreSQL to become ready.
4. Applies committed Prisma migration SQL files inside PostgreSQL.
5. Loads the idempotent fictional seed.
6. Starts the Next.js frontend and NestJS API together.

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`
- PostgreSQL: `127.0.0.1:55432`

Stop the frontend and API with `Ctrl+C`. Stop PostgreSQL when desired:

```powershell
pnpm dev:down
```

To prepare PostgreSQL, migrations, and seed without starting the applications:

```powershell
pnpm dev:setup
```

## Docker Compose

With Docker Desktop running:

```powershell
docker compose up --build
```

The API container applies committed migrations when it starts. The seed is
intentionally manual:

```powershell
docker compose exec api sh -c "cd packages/database && npx prisma db seed"
```

## Demo account

After running the seed:

```text
Email: demo@stickertrack.local
Password: DemoPassword123!
```

Isolation testing account:

```text
Email: demo2@stickertrack.local
Password: DemoPassword123!
```

Administrative Swagger testing:

```text
Email: admin@stickertrack.local
Password: DemoPassword123!
```

All collection, section, player, and sticker data in the seed is fictional.

## Localized routes

Every public frontend route has an explicit locale prefix:

```text
/pt-BR
/en
/es
/{locale}/login
/{locale}/register
/{locale}/profile
/{locale}/support
/{locale}/dashboard
/{locale}/my-collections
/{locale}/my-collections/:userCollectionId
/{locale}/my-collections/:userCollectionId/scan
/{locale}/collections/:slug
/{locale}/collections/:slug/stickers/:stickerId
```

Locale resolution follows this order:

1. URL locale
2. `NEXT_LOCALE` cookie
3. browser language
4. `pt-BR` fallback

The language selector preserves the current pathname and query string. When a
JWT is available, it also updates the user's `preferredLocale` through the API.

## Authentication API

```http
POST  /api/v1/auth/register
POST  /api/v1/auth/login
GET   /api/v1/auth/me
PATCH /api/v1/users/me/preferences
```

`GET /auth/me` and `PATCH /users/me/preferences` require:

```http
Authorization: Bearer <access-token>
```

The API returns stable error codes such as `INVALID_CREDENTIALS`. The frontend
maps these codes to localized messages instead of displaying backend text.

## Catalog and personal collections

After authentication, users are redirected to `/{locale}/dashboard`. The
dashboard lists only published collections. Collection pages provide:

- localized collection and section content;
- paginated stickers;
- code, sticker name, and player search;
- section and sticker type filters;
- album order, code, and name sorting;
- sticker and associated player details;
- visual fallbacks when no licensed image exists.

Users can start any published collection and manage quantities from the
personal collection page. Progress distinguishes unique owned stickers from
total quantity and reports missing stickers and extra copies by collection and
section. Ownership filters and quantity controls update optimistically.

## Catalog API

All catalog endpoints require a bearer token:

```http
GET /api/v1/collections
GET /api/v1/collections/:slug
GET /api/v1/collections/:collectionId/sections
GET /api/v1/collections/:collectionId/stickers
GET /api/v1/collections/:collectionId/stickers/:stickerId
GET /api/v1/collections/:collectionId/stickers/code/:code
```

Sticker list query parameters:

```text
locale
sectionId
type
search
sort=albumOrder|code|name
page
limit
```

Catalog mutations under `/api/v1/admin` require an `ADMIN` JWT.

## Personal collection API

All endpoints require a bearer token and only return or mutate data owned by
the authenticated user:

```http
POST   /api/v1/collections/:collectionId/start
GET    /api/v1/user-collections
GET    /api/v1/user-collections/:userCollectionId
GET    /api/v1/user-collections/:userCollectionId/progress
GET    /api/v1/user-collections/:userCollectionId/stickers
PUT    /api/v1/user-collections/:userCollectionId/stickers/:stickerId
POST   /api/v1/user-collections/:userCollectionId/stickers/:stickerId/increment
POST   /api/v1/user-collections/:userCollectionId/stickers/:stickerId/decrement
DELETE /api/v1/user-collections/:userCollectionId/stickers/:stickerId
```

Sticker list filters include `status=all|owned|missing|duplicates`, section,
type, search, sorting, and pagination. Increment uses an atomic Prisma update.
Decrement runs in a serializable transaction and never permits negative
quantities. Zero quantities are represented by the absence of a `UserSticker`
record.

## Camera and manual scanner

The scanner offers camera and manual modes on the same localized route. Camera
access starts only after an explicit button press and prefers the environment
camera. The visible guide is mapped from the `object-fit: cover` preview back
to natural frame coordinates before the region is cropped, resized, converted
to grayscale, given additional contrast, thresholded, and passed to
Tesseract.js in the browser. The captured frame is released after processing.

No image is uploaded, stored in the database, written to browser storage, or
sent to an external OCR service. The API receives only OCR text, normalized
candidate strings, optional confidence, and correction metadata.

```http
POST /api/v1/collections/:collectionId/scans/resolve
POST /api/v1/user-collections/:userCollectionId/scans/confirm
```

Resolution normalizes separators, case, and leading zeros through the shared
domain function. Collection-specific prefix and number lengths constrain valid
codes. Safe contextual corrections are supported for common character
confusion. The API normalizes candidates again and checks them against the
current collection. Multiple catalog matches require a user choice.

`resolve` creates one `StickerScan` and never changes quantity. `confirm`
validates ownership, collection, scan, and sticker inside a transaction. It
atomically changes a pending scan to `CONFIRMED` before incrementing, so two
concurrent confirmations cannot add the same scan twice.

Scan history records `MANUAL` or `CAMERA`, optional OCR confidence, raw OCR
text, the chosen candidate, corrections, and final status. It never stores an
image. Cancelling is a local UI action and does not create a second history
record.

Tesseract.js is dynamically imported only after capture, so the home page and
initial scanner bundle do not include the OCR runtime. First use downloads the
worker, WebAssembly core, and English model and can take several seconds.
Later runs benefit from browser caching. Low-memory phones may take longer or
fail under memory pressure.

Camera support requires HTTPS in production; localhost is accepted by modern
browsers. Chrome and Edge desktop are the primary development targets. Chrome
Android is supported through the rear-camera preference. Safari on iPhone uses
`playsInline`, `muted`, and explicit user activation, but device switching and
permission recovery can vary by iOS release.

### Real-code framing

The default development collection uses a proportional upper-right region:

```text
x=0.54, y=0.05, width=0.42, height=0.16
```

The overlay and OCR crop share one region configuration. Preview geometry
accounts for cover cropping, aspect ratio differences, portrait frames, and
landscape frames before producing the natural-frame crop. Users can move and
resize a manual region. Recognition tries the configured or manual region,
the full top band, and the full frame only as a fallback.

Every crop is enlarged between 2x and 4x and evaluated as original,
grayscale, increased contrast, normal threshold, and inverted threshold.
Tesseract uses `SINGLE_LINE`, `SINGLE_WORD`, and `SPARSE_TEXT` on the primary
region, with an uppercase-letter, digit, separator, and space whitelist.
Extracted candidates are filtered by prefixes that actually exist in the
selected collection. Raw OCR text is diagnostic evidence only and is never
submitted as though it were a manually entered sticker code.

When OCR preserves only the final letter of a known prefix, such as `D19`
instead of `NED19`, the client may reconstruct catalog-scoped candidates. The
API still validates the reconstructed value against the selected collection,
so partial-prefix recovery cannot create a match by itself.

The UI distinguishes `OCR_NO_TEXT_DETECTED`, `OCR_NO_CODE_CANDIDATE`,
`STICKER_CODE_INVALID`, `STICKER_CODE_NOT_FOUND`, and `MATCHED`. The
development seed includes the fictitious `NED 19` sticker specifically for
repeatable OCR validation.

In development, the scanner also accepts a local image. The image remains in
browser memory and uses the exact camera pipeline; only text candidates reach
the API.

Enable scanner diagnostics in `.env` and restart development:

```text
NEXT_PUBLIC_SCANNER_DEBUG=true
```

Diagnostics are compiled out unless `NODE_ENV=development`. They show the
full frame with the effective crop highlighted, crop dimensions, preview
geometry, temporary variant previews, OCR text and confidence, candidate
corrections, catalog validation matches, and the final resolution. Highlighted
frames and processed crops can be downloaded for comparison. Object URLs are
revoked when the scan is cleared or the page is left.

## CSV import

Validate a catalog without writing:

```powershell
pnpm import:stickers ./data/demo-collection.csv --dry-run
```

Import transactionally:

```powershell
pnpm import:stickers ./data/demo-collection.csv
```

The importer validates headers, rows, sticker codes, types, duplicate codes,
and duplicate album order values before opening the write transaction.

## Database commands

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Committed migrations are located under:

```text
packages/database/prisma/migrations/
```

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Translation consistency is checked automatically for missing keys, empty
values, additional keys, and incompatible ICU placeholders.

## Phase 7: real catalog and player enrichment

Administrators can validate, dry-run, and execute catalog CSV files through
`/[locale]/admin/imports`. Validation is read-only. Execution repeats all
checks and applies sections, players, and stickers in one transaction.
Sticker identity remains internal through `Collection + normalizedCode`;
external providers never decide which player belongs to a sticker code.

Player administration is available at `/[locale]/admin/players`. Candidate
search uses the `PlayerDataProvider` abstraction. The production provider uses
the official Wikidata Wikibase API for entities and Wikimedia Commons
`imageinfo` for file-specific attribution. External calls occur only after an
administrator action and use PostgreSQL cache, timeout, bounded retry, and a
minimum request interval.

Images begin as `PENDING`. Approval requires an HTTPS source URL, author,
license, and license URL. Only `APPROVED` images are returned by public
catalog, personal collection, and scanner endpoints. Sticker details render
the reusable `PlayerImageAttribution` component.

Phase 7 endpoints:

```text
POST   /api/v1/admin/catalog-imports/validate
POST   /api/v1/admin/catalog-imports/execute
GET    /api/v1/admin/catalog-imports/:importId
GET    /api/v1/admin/players
GET    /api/v1/admin/players/:playerId
PATCH  /api/v1/admin/players/:playerId
GET    /api/v1/admin/players/:playerId/provider-candidates
POST   /api/v1/admin/players/:playerId/enrich
POST   /api/v1/admin/players/:playerId/images
PATCH  /api/v1/admin/player-images/:imageId
DELETE /api/v1/admin/player-images/:imageId
```

## Optional project support

Phase 8 adds a discreet external support link in the footer, profile, and
localized `/{locale}/support` page. Support is voluntary, does not unlock
features, and has no effect on collection or scanner functionality.

The implementation uses only a normal HTTPS link. It includes no Buy Me a
Coffee SDK, script, iframe, widget, tracking pixel, webhook, or automatic
request. The external service receives a request only after the user clicks
the link.

The support callout is not rendered on scanner, login, or registration routes.
An invalid URL is ignored; development logs a warning without failing the
application or build.

## Security notes

- Passwords are hashed with Argon2.
- Authentication endpoints are rate limited.
- Protected API routes use JWT bearer authentication.
- Helmet, strict validation, configurable CORS, and response error codes are
  configured.
- The browser stores the Phase 2 access token in local storage. A later
  production-hardening phase should introduce rotating refresh tokens in
  secure, HTTP-only cookies.

## Scope boundaries

Continuous scanning, automatic multi-sticker recognition, sticker-front image
comparison, trading, social features, payment processing, subscriptions, and
supporter benefits remain excluded.

StickerTrack is an independent collection management tool and is not
affiliated with, authorized by, or associated with publishers, sports
organizations, or owners of referenced trademarks.
## Production preparation

Phase 9 adds strict environment validation, restricted CORS, security headers, structured request logs, health checks, password recovery, account deletion, production migrations and seed commands, non-root production containers, CI, and localized privacy and terms pages.

Use `.env.development.example` locally and `.env.production.example` only as a production template. Generate a JWT secret with a cryptographically secure tool, for example `openssl rand -base64 48`, and store it in the hosting secret manager.

Production release:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm deploy:migrate
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

See `docs/deployment.md`, `docs/backup-and-restore.md`, and `docs/performance.md` before exposing the service publicly.
