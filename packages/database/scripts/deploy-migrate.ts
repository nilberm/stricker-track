import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const migrationsDirectory = path.resolve('prisma/migrations');

async function main() {
  const [{ legacyTable, prismaTable }] = await prisma.$queryRaw<
    Array<{ legacyTable: string | null; prismaTable: string | null }>
  >`
    SELECT
      to_regclass('public."_sticker_track_migrations"')::text AS "legacyTable",
      to_regclass('public."_prisma_migrations"')::text AS "prismaTable"
  `;

  if (legacyTable && !prismaTable) {
    const applied = await prisma.$queryRaw<
      Array<{ name: string }>
    >`SELECT "name" FROM "_sticker_track_migrations" ORDER BY "name"`;
    const available = new Set(
      readdirSync(migrationsDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name),
    );

    for (const { name } of applied) {
      if (!available.has(name)) {
        throw new Error(
          `Legacy migration ${name} is not present in the repository.`,
        );
      }
      runPrisma(['migrate', 'resolve', '--applied', name]);
    }
  }

  runPrisma(['migrate', 'deploy']);
}

function runPrisma(arguments_: string[]) {
  const cli = path.resolve('node_modules/prisma/build/index.js');
  const result = spawnSync(process.execPath, [cli, ...arguments_], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`Prisma exited with status ${result.status ?? 'unknown'}.`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Migration failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
