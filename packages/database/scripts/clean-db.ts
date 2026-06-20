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
  await prisma.sticker.deleteMany({});
  await prisma.collectionSectionTranslation.deleteMany({});
  await prisma.collectionSection.deleteMany({});
  await prisma.player.deleteMany({});
  console.log('Database cleaned for fresh import');
  await prisma.$disconnect();
}

main().catch(console.error);
