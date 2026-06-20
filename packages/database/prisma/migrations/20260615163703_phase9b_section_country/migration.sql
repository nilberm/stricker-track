/*
  Warnings:

  - Made the column `code` on table `CollectionSection` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CatalogImport" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CollectionSection" ADD COLUMN     "countryIso2" VARCHAR(2),
ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProviderCache" ALTER COLUMN "id" DROP DEFAULT;
