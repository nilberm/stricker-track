# Performance review

- Tesseract remains lazy-loaded in the scanner client, keeping OCR code out of initial routes. OCR models are browser-cached by Tesseract and images are not sent to the API.
- Catalog and personal collection endpoints use pagination. Existing indexes cover normalized sticker codes, collection ownership, quantities, update order, player review, provider cache expiry, and reset token lookup.
- Prisma uses the deployment database connection string. Production connection limits and pooling must match the selected PostgreSQL provider; serverless deployments should use the provider's supported pooler.
- CSV import is memory-only, capped by bytes and rows, rejects spreadsheet formula prefixes, and is not persisted after parsing. Large imports remain administrative and transactional.
- External provider requests have timeout, retry, cache, and minimum-interval controls. Wikimedia image hosts are allow-listed.
- Next.js standalone output excludes public browser source maps and restricts external image hosts.

Before launch, capture baseline cold start, p95 API latency, scanner bundle size, OCR memory on a mid-range phone, database connection count, and a maximum-size CSV import. Optimize only regressions supported by measurements.

Minimal PWA installation is deferred to Phase 10. No service worker is added in Phase 9, avoiding accidental caching of tokens or authenticated responses.
