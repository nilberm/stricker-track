-- AlterTable
ALTER TABLE "UserCollection" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserSticker" ADD COLUMN     "tradeWeight" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "TradeChat" (
    "id" UUID NOT NULL,
    "userAId" UUID NOT NULL,
    "userBId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeMessage" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeChat_userAId_updatedAt_idx" ON "TradeChat"("userAId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "TradeChat_userBId_updatedAt_idx" ON "TradeChat"("userBId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TradeChat_userAId_userBId_key" ON "TradeChat"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "TradeMessage_chatId_createdAt_idx" ON "TradeMessage"("chatId", "createdAt" ASC);

-- AddForeignKey
ALTER TABLE "TradeChat" ADD CONSTRAINT "TradeChat_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeChat" ADD CONSTRAINT "TradeChat_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeMessage" ADD CONSTRAINT "TradeMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "TradeChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeMessage" ADD CONSTRAINT "TradeMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
