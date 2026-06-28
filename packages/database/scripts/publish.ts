import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.collection.updateMany({
    data: { status: 'PUBLISHED' }
  });
  console.log(result);
}
main().finally(() => prisma.$disconnect());
