import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { parse } from 'csv-parse/sync';
import { PrismaClient, StickerType, SupportedLocale } from '@prisma/client';
import { normalizeStickerCode } from '@sticker-track/shared';

const requiredHeaders = [
  'collection_slug',
  'collection_name_pt_br',
  'collection_name_en',
  'collection_name_es',
  'section_code',
  'section_type',
  'section_name_pt_br',
  'section_name_en',
  'section_name_es',
  'sticker_code',
  'sticker_type',
  'sticker_name_pt_br',
  'sticker_name_en',
  'sticker_name_es',
  'album_order',
  'section_order',
  'player_name',
  'country_iso2',
  'wikidata_id',
] as const;

type CsvRow = Record<(typeof requiredHeaders)[number], string>;
type ValidRow = CsvRow & {
  normalizedCode: string;
  orderNumber: number;
  sectionOrderNumber: number;
  stickerType: StickerType;
};

type ImportReport = {
  file: string;
  dryRun: boolean;
  rows: number;
  validRows: number;
  invalidRows: number;
  created: { sections: number; players: number; stickers: number };
  updated: { players: number; stickers: number };
  ignored: number;
  errors: string[];
};

async function loadRootEnvironment(directory: string) {
  const content = await readFile(resolve(directory, '.env'), 'utf8').catch(
    () => '',
  );
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    process.env[key] ??= value;
  }
}

function validateRows(rows: CsvRow[]) {
  const errors: string[] = [];
  const seenCodes = new Set<string>();
  const seenOrders = new Set<string>();
  const validRows: ValidRow[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const missing = requiredHeaders.filter((header) => !(header in row));
    if (missing.length) {
      errors.push(`Row ${rowNumber}: missing headers ${missing.join(', ')}`);
      return;
    }
    const normalizedCode = normalizeStickerCode(row.sticker_code);
    const orderNumber = Number(row.album_order);
    const sectionOrderNumber = Number(row.section_order);
    
    if (!row.collection_slug || !row.section_code || (!row.sticker_name_pt_br && !row.sticker_name_en && !row.sticker_name_es)) {
      errors.push(`Row ${rowNumber}: required values are empty`);
    }
    if (!row.sticker_name_pt_br || !row.sticker_name_en || !row.sticker_name_es) {
      errors.push(`Row ${rowNumber}: missing translation for sticker name (WARNING)`);
    }
    if (!normalizedCode) {
      errors.push(`Row ${rowNumber}: invalid sticker code`);
    }
    if (!Object.values(StickerType).includes(row.sticker_type as StickerType)) {
      errors.push(`Row ${rowNumber}: invalid sticker type`);
    }
    if (!Number.isInteger(orderNumber) || orderNumber < 1) {
      errors.push(`Row ${rowNumber}: order must be a positive integer`);
    }
    if (Object.values(row).some((value) => /^[=+@]/.test(value))) {
      errors.push(`Row ${rowNumber}: unsafe spreadsheet formula prefix`);
    }

    const codeKey = `${row.collection_slug}:${normalizedCode}`;
    const orderKey = `${row.collection_slug}:${orderNumber}`;
    if (seenCodes.has(codeKey)) {
      errors.push(`Row ${rowNumber}: duplicate sticker code`);
    }
    if (seenOrders.has(orderKey)) {
      errors.push(`Row ${rowNumber}: duplicate sticker order`);
    }
    seenCodes.add(codeKey);
    seenOrders.add(orderKey);

    if (
      normalizedCode &&
      Number.isInteger(orderNumber) &&
      orderNumber > 0 &&
      Object.values(StickerType).includes(row.sticker_type as StickerType)
    ) {
      validRows.push({
        ...row,
        normalizedCode,
        orderNumber,
        sectionOrderNumber,
        stickerType: row.sticker_type as StickerType,
      });
    }
  });

  return { errors, validRows };
}

async function main() {
  const argumentsList = process.argv.slice(2);
  const fileArgument = argumentsList.find(
    (argument) => !argument.startsWith('-'),
  );
  const dryRun = argumentsList.includes('--dry-run');
  if (!fileArgument) {
    throw new Error('Usage: pnpm import:stickers <file.csv> [--dry-run]');
  }

  const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
  await loadRootEnvironment(invocationDirectory);
  const file = resolve(invocationDirectory, fileArgument);
  const content = await readFile(file, 'utf8');
  const rows = parse(content, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  const headers = Object.keys(rows[0] ?? {});
  const headerErrors = requiredHeaders
    .filter((header) => !headers.includes(header))
    .map((header) => `Missing required header: ${header}`);
  const { errors, validRows } = validateRows(rows);
  const report: ImportReport = {
    file,
    dryRun,
    rows: rows.length,
    validRows: validRows.length,
    invalidRows: rows.length - validRows.length,
    created: { sections: 0, players: 0, stickers: 0 },
    updated: { players: 0, stickers: 0 },
    ignored: 0,
    errors: [...headerErrors, ...errors],
  };

  if (report.errors.length || dryRun) {
    console.log(JSON.stringify(report, null, 2));
    if (report.errors.length) process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(
      async (transaction) => {
      for (const row of validRows) {
        const collection = await transaction.collection.upsert({
          where: { slug: row.collection_slug },
          create: {
            slug: row.collection_slug,
            totalStickers: 0, // This should probably be updated later, but 0 is a safe default
            translations: {
              create: [
                { locale: SupportedLocale.PT_BR, name: row.collection_name_pt_br },
                { locale: SupportedLocale.EN, name: row.collection_name_en },
                { locale: SupportedLocale.ES, name: row.collection_name_es },
              ].filter(t => t.name)
            }
          },
          update: {}
        });
        let section = await transaction.collectionSection.findFirst({
          where: { collectionId: collection.id, code: row.section_code },
        });
        if (!section) {
          const lastSection = await transaction.collectionSection.aggregate({
            where: { collectionId: collection.id },
            _max: { order: true },
          });
          section = await transaction.collectionSection.create({
            data: {
              collectionId: collection.id,
              code: row.section_code,
              type: row.section_type as any,
              countryIso2: row.country_iso2 || null,
              order: (lastSection._max.order ?? 0) + 1,
              translations: {
                create: [
                  { locale: SupportedLocale.PT_BR, name: row.section_name_pt_br },
                  { locale: SupportedLocale.EN, name: row.section_name_en },
                  { locale: SupportedLocale.ES, name: row.section_name_es },
                ].filter(t => t.name)
              },
            },
          });
          report.created.sections += 1;
        } else {
          // Update the section if it already exists to ensure it has type and countryIso2
          section = await transaction.collectionSection.update({
            where: { id: section.id },
            data: {
              type: row.section_type as any,
              countryIso2: row.country_iso2 || null,
            }
          });
          // Update section translations manually here to fix the incorrect ones from previous import
          for (const locale of Object.values(SupportedLocale)) {
            const localeName = locale === SupportedLocale.PT_BR ? row.section_name_pt_br : locale === SupportedLocale.EN ? row.section_name_en : row.section_name_es;
            if (!localeName) continue;
            const existing = await transaction.collectionSectionTranslation.findFirst({ where: { sectionId: section.id, locale } });
            if (existing) {
              await transaction.collectionSectionTranslation.update({
                where: { id: existing.id },
                data: { name: localeName }
              });
            } else {
              await transaction.collectionSectionTranslation.create({
                data: { sectionId: section.id, locale, name: localeName }
              });
            }
          }
        }

        let playerId: string | undefined;
        if (row.player_name) {
          const normalizedName = normalizeName(row.player_name);
          const existingPlayer = row.wikidata_id
            ? await transaction.player.findUnique({
                where: { wikidataId: row.wikidata_id },
                select: { id: true },
              })
            : await transaction.player.findFirst({
                where: {
                  normalizedName,
                  countryCode: row.country_iso2 || null,
                },
                select: { id: true },
              });
          const player = row.wikidata_id
            ? await transaction.player.upsert({
                where: { wikidataId: row.wikidata_id },
                update: {
                  name: row.player_name,
                  normalizedName,
                  countryCode: row.country_iso2 || undefined,
                },
                create: {
                  name: row.player_name,
                  normalizedName,
                  countryCode: row.country_iso2 || undefined,
                  wikidataId: row.wikidata_id,
                },
              })
            : ((await transaction.player.findFirst({
                where: {
                  normalizedName,
                  countryCode: row.country_iso2 || null,
                },
              })) ??
              (await transaction.player.create({
                data: {
                  name: row.player_name,
                  normalizedName,
                  countryCode: row.country_iso2 || undefined,
                },
              })));
          playerId = player.id;
          if (existingPlayer) report.updated.players += 1;
          else report.created.players += 1;
        }

        const match = row.normalizedCode.match(/^([A-Z]+)(\d+)$/);
        const prefix = match ? match[1] : null;
        const number = match ? Number(match[2]) : (row.normalizedCode === '00' ? 0 : null);

        const existing = await transaction.sticker.findUnique({
          where: {
            collectionId_normalizedCode: {
              collectionId: collection.id,
              normalizedCode: row.normalizedCode,
            },
          },
          select: { id: true },
        });
        await transaction.sticker.upsert({
          where: {
            collectionId_normalizedCode: {
              collectionId: collection.id,
              normalizedCode: row.normalizedCode,
            },
          },
          update: {
            sectionId: section.id,
            playerId,
            code: row.sticker_code,
            name: row.sticker_name_pt_br,
            type: row.stickerType,
            albumOrder: row.orderNumber,
            sectionOrder: row.sectionOrderNumber,
            prefix,
            number,
          },
          create: {
            collectionId: collection.id,
            sectionId: section.id,
            playerId,
            code: row.sticker_code,
            normalizedCode: row.normalizedCode,
            prefix,
            number,
            name: row.sticker_name_pt_br,
            type: row.stickerType,
            albumOrder: row.orderNumber,
            sectionOrder: row.sectionOrderNumber,
          },
        });
        if (existing) report.updated.stickers += 1;
        else report.created.stickers += 1;
      }
    },
    { timeout: 30000 }
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
