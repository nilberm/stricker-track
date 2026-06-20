-- Add indexes used by personal collection progress and recent activity queries.
CREATE INDEX "UserCollection_userId_updatedAt_idx"
ON "UserCollection"("userId", "updatedAt" DESC);

CREATE INDEX "UserSticker_userCollectionId_updatedAt_idx"
ON "UserSticker"("userCollectionId", "updatedAt" DESC);

CREATE INDEX "UserSticker_userCollectionId_quantity_idx"
ON "UserSticker"("userCollectionId", "quantity");
