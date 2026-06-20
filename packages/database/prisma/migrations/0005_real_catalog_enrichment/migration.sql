CREATE TYPE "EnrichmentProvider" AS ENUM ('WIKIDATA', 'MOCK', 'MANUAL');
CREATE TYPE "EnrichmentStatus" AS ENUM ('NOT_STARTED', 'CANDIDATES_FOUND', 'REVIEW_REQUIRED', 'APPROVED', 'FAILED');
CREATE TYPE "ImageReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "CatalogImportStatus" AS ENUM ('COMPLETED', 'FAILED');

ALTER TABLE "Player"
ADD COLUMN "normalizedName" TEXT,
ADD COLUMN "countryName" TEXT,
ADD COLUMN "enrichmentStatus" "EnrichmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "enrichmentProvider" "EnrichmentProvider",
ADD COLUMN "lastProviderQueryAt" TIMESTAMP(3),
ADD COLUMN "lastEnrichedAt" TIMESTAMP(3),
ADD COLUMN "enrichmentApprovedAt" TIMESTAMP(3),
ADD COLUMN "enrichmentApprovedBy" UUID,
ADD COLUMN "enrichmentError" TEXT;

UPDATE "Player"
SET "normalizedName" = LOWER(REGEXP_REPLACE(TRIM("name"), '\s+', ' ', 'g'));

ALTER TABLE "PlayerImage"
ADD COLUMN "reviewStatus" "ImageReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" UUID;

CREATE TABLE "CatalogImport" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fileName" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "status" "CatalogImportStatus" NOT NULL,
  "report" JSONB NOT NULL,
  "error" TEXT,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "CatalogImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderCache" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" "EnrichmentProvider" NOT NULL,
  "cacheKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "lastRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderCache_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Player_normalizedName_countryCode_idx" ON "Player"("normalizedName", "countryCode");
CREATE INDEX "Player_enrichmentStatus_idx" ON "Player"("enrichmentStatus");
CREATE INDEX "PlayerImage_playerId_reviewStatus_idx" ON "PlayerImage"("playerId", "reviewStatus");
CREATE INDEX "CatalogImport_createdAt_idx" ON "CatalogImport"("createdAt" DESC);
CREATE INDEX "CatalogImport_contentHash_idx" ON "CatalogImport"("contentHash");
CREATE INDEX "ProviderCache_expiresAt_idx" ON "ProviderCache"("expiresAt");
CREATE UNIQUE INDEX "ProviderCache_provider_cacheKey_key" ON "ProviderCache"("provider", "cacheKey");

ALTER TABLE "Player"
ADD CONSTRAINT "Player_enrichmentApprovedBy_fkey"
FOREIGN KEY ("enrichmentApprovedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlayerImage"
ADD CONSTRAINT "PlayerImage_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CatalogImport"
ADD CONSTRAINT "CatalogImport_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
