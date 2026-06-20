import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running structural seed...');
  // Currently there are no required structural records to insert.
  // Add initialization data here in the future if needed.
  console.log('Structural seed finished.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
