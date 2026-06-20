const { PrismaClient } = require('@sticker-track/database');

const prisma = new PrismaClient();

async function main() {
  console.log('Finding dummy collection translation...');
  const translation = await prisma.collectionTranslation.findFirst({
    where: {
      name: {
        contains: 'Torneio Internacional de Demonstração'
      }
    }
  });

  if (!translation) {
    console.log('Collection not found! It might have already been deleted.');
    return;
  }

  console.log(`Found collection translation for collection ID: ${translation.collectionId}. Deleting...`);

  await prisma.collection.delete({
    where: { id: translation.collectionId }
  });

  console.log('Dummy collection successfully deleted!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
