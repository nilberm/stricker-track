ALTER TYPE "ScanStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';

ALTER TABLE "Collection"
ADD COLUMN "codePrefixMinLength" INTEGER,
ADD COLUMN "codePrefixMaxLength" INTEGER,
ADD COLUMN "codeNumberMinLength" INTEGER,
ADD COLUMN "codeNumberMaxLength" INTEGER;

ALTER TABLE "StickerScan"
ADD COLUMN "userCollectionId" UUID,
ADD COLUMN "confirmedAt" TIMESTAMP(3);

UPDATE "StickerScan" AS scan
SET "userCollectionId" = user_collection."id"
FROM "UserCollection" AS user_collection
WHERE user_collection."userId" = scan."userId"
  AND user_collection."collectionId" = scan."collectionId";

DELETE FROM "StickerScan" WHERE "userCollectionId" IS NULL;

ALTER TABLE "StickerScan"
ALTER COLUMN "userCollectionId" SET NOT NULL;

ALTER TABLE "StickerScan"
ADD CONSTRAINT "StickerScan_userCollectionId_fkey"
FOREIGN KEY ("userCollectionId") REFERENCES "UserCollection"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "StickerScan_userCollectionId_createdAt_idx"
ON "StickerScan"("userCollectionId", "createdAt");
