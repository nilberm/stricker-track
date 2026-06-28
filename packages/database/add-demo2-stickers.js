process.env.DATABASE_URL = "postgresql://sticker_track:sticker_track@127.0.0.1:55432/sticker_track?schema=public";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'demo2@stickertrack.local' } });
  if (!user) throw new Error('demo2 not found');

  const collection = await prisma.collection.findFirst({ where: { status: 'PUBLISHED' } });
  if (!collection) throw new Error('No published collection');

  const userCollection = await prisma.userCollection.upsert({
    where: { userId_collectionId: { userId: user.id, collectionId: collection.id } },
    create: { userId: user.id, collectionId: collection.id, isPublic: true },
    update: { isPublic: true },
  });

  const stickers = await prisma.sticker.findMany({ where: { collectionId: collection.id } });

  console.log(`Adding random quantities and weights to ${stickers.length} stickers for demo2...`);
  
  let added = 0;
  for (let i = 0; i < stickers.length; i++) {
    const sticker = stickers[i];
    const rand = Math.random();
    let quantity = 0;
    let tradeWeight = 1;
    
    // 30% missing, 40% glued only, 30% duplicates
    if (rand < 0.3) {
      quantity = 0;
    } else if (rand < 0.7) {
      quantity = 1;
    } else {
      quantity = Math.floor(Math.random() * 3) + 2; // 2 to 4
      tradeWeight = Math.random() > 0.8 ? 2 : 1; // 20% chance of weight 2
    }

    if (quantity > 0) {
      added++;
      await prisma.userSticker.upsert({
        where: { userCollectionId_stickerId: { userCollectionId: userCollection.id, stickerId: sticker.id } },
        create: { userCollectionId: userCollection.id, stickerId: sticker.id, quantity, tradeWeight },
        update: { quantity, tradeWeight },
      });
    }
  }
  
  console.log(`Done! demo2 now owns ${added} unique stickers with random duplicates and weights.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
