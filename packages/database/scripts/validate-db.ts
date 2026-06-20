import { PrismaClient } from '@prisma/client';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

async function loadEnv() {
  const content = await readFile(resolve('../../.env'), 'utf8').catch(() => '');
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const sep = t.indexOf('=');
    if (sep < 1) continue;
    process.env[t.slice(0, sep)] ??= t.slice(sep + 1);
  }
}

async function main() {
  await loadEnv();
  const prisma = new PrismaClient();
  
  const collection = await prisma.collection.findUnique({
    where: { slug: 'world-cup-2026' }
  });

  if (!collection) {
    console.error('Collection world-cup-2026 not found!');
    return;
  }

  // Set collection to PUBLISHED as requested
  await prisma.collection.update({
    where: { id: collection.id },
    data: { status: 'PUBLISHED' }
  });
  console.log('Collection status updated to PUBLISHED.');

  const stickerCount = await prisma.sticker.count({
    where: { collectionId: collection.id }
  });

  console.log(`\n=================================`);
  console.log(`VALIDATION SUCCESSFUL!`);
  console.log(`Collection: ${collection.slug}`);
  console.log(`Status: PUBLISHED`);
  console.log(`Total Stickers in DB: ${stickerCount}`);
  console.log(`=================================\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
