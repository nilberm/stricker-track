-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SupportedLocale" AS ENUM ('PT_BR', 'EN', 'ES');

-- CreateEnum
CREATE TYPE "StickerType" AS ENUM ('PLAYER', 'TEAM', 'BADGE', 'STADIUM', 'TROPHY', 'MASCOT', 'SPECIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ImageProvider" AS ENUM ('WIKIMEDIA_COMMONS', 'WIKIDATA', 'THE_SPORTS_DB', 'OTHER');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('MATCHED', 'NOT_FOUND', 'INVALID', 'CONFIRMATION_REQUIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "preferredLocale" "SupportedLocale" NOT NULL DEFAULT 'PT_BR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "publisherName" TEXT,
    "totalStickers" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "codePattern" TEXT,
    "codeExample" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTranslation" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "locale" "SupportedLocale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionSection" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "code" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionSectionTranslation" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "locale" "SupportedLocale" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionSectionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sticker" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "sectionId" UUID,
    "playerId" UUID,
    "code" TEXT NOT NULL,
    "normalizedCode" TEXT NOT NULL,
    "prefix" TEXT,
    "number" INTEGER,
    "name" TEXT NOT NULL,
    "type" "StickerType" NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sticker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "countryCode" TEXT,
    "nationality" TEXT,
    "position" TEXT,
    "birthDate" DATE,
    "wikidataId" TEXT,
    "sportsDbId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerImage" (
    "id" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "author" TEXT,
    "license" TEXT,
    "licenseUrl" TEXT,
    "provider" "ImageProvider" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCollection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSticker" (
    "id" UUID NOT NULL,
    "userCollectionId" UUID NOT NULL,
    "stickerId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "firstAcquiredAt" TIMESTAMP(3),
    "lastAcquiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSticker_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserSticker_quantity_check" CHECK ("quantity" >= 0)
);

-- CreateTable
CREATE TABLE "StickerScan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "rawText" TEXT NOT NULL,
    "detectedCode" TEXT,
    "normalizedCode" TEXT,
    "stickerId" UUID,
    "confidence" DOUBLE PRECISION,
    "status" "ScanStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StickerScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionTranslation_collectionId_locale_key" ON "CollectionTranslation"("collectionId", "locale");

-- CreateIndex
CREATE INDEX "CollectionSection_collectionId_code_idx" ON "CollectionSection"("collectionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionSection_collectionId_order_key" ON "CollectionSection"("collectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionSectionTranslation_sectionId_locale_key" ON "CollectionSectionTranslation"("sectionId", "locale");

-- CreateIndex
CREATE INDEX "Sticker_sectionId_idx" ON "Sticker"("sectionId");

-- CreateIndex
CREATE INDEX "Sticker_playerId_idx" ON "Sticker"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Sticker_collectionId_normalizedCode_key" ON "Sticker"("collectionId", "normalizedCode");

-- CreateIndex
CREATE UNIQUE INDEX "Sticker_collectionId_order_key" ON "Sticker"("collectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Player_wikidataId_key" ON "Player"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_sportsDbId_key" ON "Player"("sportsDbId");

-- CreateIndex
CREATE INDEX "PlayerImage_playerId_isPrimary_idx" ON "PlayerImage"("playerId", "isPrimary");

-- CreateIndex
CREATE INDEX "UserCollection_collectionId_idx" ON "UserCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCollection_userId_collectionId_key" ON "UserCollection"("userId", "collectionId");

-- CreateIndex
CREATE INDEX "UserSticker_stickerId_idx" ON "UserSticker"("stickerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSticker_userCollectionId_stickerId_key" ON "UserSticker"("userCollectionId", "stickerId");

-- CreateIndex
CREATE INDEX "StickerScan_userId_createdAt_idx" ON "StickerScan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StickerScan_collectionId_normalizedCode_idx" ON "StickerScan"("collectionId", "normalizedCode");

-- AddForeignKey
ALTER TABLE "CollectionTranslation" ADD CONSTRAINT "CollectionTranslation_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionSection" ADD CONSTRAINT "CollectionSection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionSectionTranslation" ADD CONSTRAINT "CollectionSectionTranslation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CollectionSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sticker" ADD CONSTRAINT "Sticker_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sticker" ADD CONSTRAINT "Sticker_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CollectionSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sticker" ADD CONSTRAINT "Sticker_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerImage" ADD CONSTRAINT "PlayerImage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollection" ADD CONSTRAINT "UserCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollection" ADD CONSTRAINT "UserCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSticker" ADD CONSTRAINT "UserSticker_userCollectionId_fkey" FOREIGN KEY ("userCollectionId") REFERENCES "UserCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSticker" ADD CONSTRAINT "UserSticker_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "Sticker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StickerScan" ADD CONSTRAINT "StickerScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StickerScan" ADD CONSTRAINT "StickerScan_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StickerScan" ADD CONSTRAINT "StickerScan_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "Sticker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
