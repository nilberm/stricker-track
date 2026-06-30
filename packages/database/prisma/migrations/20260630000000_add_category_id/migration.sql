-- CreateEnum
CREATE TYPE "CollectionCategory" AS ENUM ('SPORTS', 'TCG_POKEMON', 'TCG_MAGIC', 'CUSTOM', 'OTHER');

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "categoryId" "CollectionCategory" NOT NULL DEFAULT 'SPORTS',
ADD COLUMN     "series" TEXT;
