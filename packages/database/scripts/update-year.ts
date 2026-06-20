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

  await prisma.collection.update({
    where: { slug: 'world-cup-2026' },
    data: { releaseYear: 2026 }
  });
  console.log('Updated releaseYear to 2026');
  
  await prisma.$disconnect();
}

main().catch(console.error);
