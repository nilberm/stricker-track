-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('NATIONAL_TEAM', 'INTRODUCTION', 'STADIUMS', 'SPECIAL', 'OTHER');

-- AlterTable Collection (Step 1: Add new column with default)
ALTER TABLE "Collection" ADD COLUMN "status" "CollectionStatus" NOT NULL DEFAULT 'DRAFT';

-- Update Data (Step 2: Map isPublished to status)
UPDATE "Collection" SET "status" = 'PUBLISHED' WHERE "isPublished" = true;
UPDATE "Collection" SET "status" = 'DRAFT' WHERE "isPublished" = false;

-- AlterTable Collection (Step 3: Drop old column)
ALTER TABLE "Collection" DROP COLUMN "isPublished";

-- AlterTable CollectionSection
ALTER TABLE "CollectionSection" ADD COLUMN "type" "SectionType" NOT NULL DEFAULT 'OTHER';

-- DropIndex CollectionSection
DROP INDEX IF EXISTS "CollectionSection_collectionId_code_idx";

-- CreateIndex CollectionSection
CREATE UNIQUE INDEX "CollectionSection_collectionId_code_key" ON "CollectionSection"("collectionId", "code");

-- AlterTable Sticker (Step 1: Add new columns)
ALTER TABLE "Sticker" ADD COLUMN "albumOrder" INTEGER;
ALTER TABLE "Sticker" ADD COLUMN "sectionOrder" INTEGER;

-- Update Data (Step 2: Map order to new columns)
UPDATE "Sticker" SET "albumOrder" = "order", "sectionOrder" = "order";

-- AlterTable Sticker (Step 3: Make them NOT NULL and drop old column)
ALTER TABLE "Sticker" ALTER COLUMN "albumOrder" SET NOT NULL;
ALTER TABLE "Sticker" ALTER COLUMN "sectionOrder" SET NOT NULL;
ALTER TABLE "Sticker" DROP COLUMN "order";

-- DropIndex Sticker
DROP INDEX IF EXISTS "Sticker_collectionId_order_key";

-- CreateIndex Sticker
CREATE UNIQUE INDEX "Sticker_collectionId_albumOrder_key" ON "Sticker"("collectionId", "albumOrder");
CREATE UNIQUE INDEX "Sticker_sectionId_sectionOrder_key" ON "Sticker"("sectionId", "sectionOrder");

-- CreateTable StickerTranslation
CREATE TABLE "StickerTranslation" (
    "id" UUID NOT NULL,
    "stickerId" UUID NOT NULL,
    "locale" "SupportedLocale" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StickerTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex StickerTranslation
CREATE UNIQUE INDEX "StickerTranslation_stickerId_locale_key" ON "StickerTranslation"("stickerId", "locale");

-- AddForeignKey StickerTranslation
ALTER TABLE "StickerTranslation" ADD CONSTRAINT "StickerTranslation_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "Sticker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
