import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CatalogImportStatus,
  Prisma,
  StickerType,
  SectionType,
  SupportedLocale,
} from '@sticker-track/database';
import { normalizeStickerCode } from '@sticker-track/shared';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import type { CatalogImportInputDto } from './dto/catalog-import.dto';

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

type Header = (typeof requiredHeaders)[number];
type CsvRow = Record<Header, string>;
type ValidatedRow = CsvRow & {
  rowNumber: number;
  normalizedCode: string;
  normalizedPlayerName?: string;
  stickerType: StickerType;
  sectionType: SectionType;
  albumOrderNumber: number;
  sectionOrderNumber: number;
};

export type CatalogImportReport = {
  fileName: string;
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  created: { sections: number; players: number; stickers: number };
  updated: { players: number; stickers: number };
  ignored: number;
  errors: Array<{ row?: number; code: string; message: string }>;
  warnings: Array<{ row?: number; code: string; message: string }>;
};

@Injectable()
export class CatalogImportService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  async validate(input: CatalogImportInputDto) {
    const plan = this.parse(input);
    await this.validateCollections(plan.rows, plan.report);
    if (!plan.report.errors.length) {
      await this.previewRows(plan.rows, plan.report);
    }
    return plan.report;
  }

  async execute(input: CatalogImportInputDto, administratorId: string) {
    const plan = this.parse(input);
    await this.validateCollections(plan.rows, plan.report);
    if (input.dryRun && !plan.report.errors.length) {
      await this.previewRows(plan.rows, plan.report);
    }
    if (input.dryRun || plan.report.errors.length) {
      return { importId: null, report: plan.report };
    }

    const contentHash = createHash('sha256').update(input.csv).digest('hex');
    const report = await this.prisma.$transaction(async (transaction) => {
      const transactionReport = structuredClone(plan.report);
      await this.applyRows(transaction, plan.rows, transactionReport);
      return transactionReport;
    });
    const record = await this.prisma.catalogImport.create({
      data: {
        fileName: safeText(input.fileName, 255),
        contentHash,
        status: CatalogImportStatus.COMPLETED,
        report: report,
        createdById: administratorId,
        completedAt: new Date(),
      },
    });
    return { importId: record.id, report };
  }

  async find(importId: string) {
    const record = await this.prisma.catalogImport.findUnique({
      where: { id: importId },
    });
    if (!record) {
      throw new NotFoundException({
        code: 'CATALOG_IMPORT_NOT_FOUND',
        message: 'Catalog import not found',
      });
    }
    return record;
  }

  private parse(input: CatalogImportInputDto) {
    const report: CatalogImportReport = {
      fileName: safeText(input.fileName, 255),
      dryRun: Boolean(input.dryRun),
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      created: { sections: 0, players: 0, stickers: 0 },
      updated: { players: 0, stickers: 0 },
      ignored: 0,
      errors: [],
      warnings: [],
    };
    let rows: CsvRow[] = [];
    const maximumBytes = this.config?.get<number>('CSV_MAX_BYTES') ?? 2_000_000;
    const maximumRows = this.config?.get<number>('CSV_MAX_ROWS') ?? 10_000;
    if (Buffer.byteLength(input.csv, 'utf8') > maximumBytes) {
      report.errors.push({
        code: 'CSV_TOO_LARGE',
        message: 'CSV payload exceeds the configured byte limit',
      });
      return { rows: [] as ValidatedRow[], report };
    }
    try {
      rows = parse(input.csv, {
        bom: true,
        columns: (headers: string[]) => {
          const missing = requiredHeaders.filter(
            (header) => !headers.includes(header),
          );
          const unexpected = headers.filter(
            (header) => !requiredHeaders.includes(header as Header),
          );
          if (missing.length || unexpected.length) {
            throw new Error(
              `INVALID_HEADERS:${missing.join(',')}:${unexpected.join(',')}`,
            );
          }
          return headers;
        },
        relax_column_count: false,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];
    } catch (error) {
      report.errors.push({
        code: 'MALFORMED_CSV',
        message:
          error instanceof Error
            ? error.message
            : 'Malformed CSV or legacy format used.',
      });
      return { rows: [] as ValidatedRow[], report };
    }

    if (rows.length > maximumRows) {
      report.errors.push({
        code: 'CSV_TOO_MANY_ROWS',
        message: 'CSV payload exceeds the configured row limit',
      });
      return { rows: [] as ValidatedRow[], report };
    }

    report.totalRows = rows.length;
    const seenCodes = new Set<string>();
    const seenAlbumOrders = new Set<string>();
    const seenSectionOrders = new Set<string>();
    const validRows: ValidatedRow[] = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const { errors, warnings } = this.validateRow(row, rowNumber);
      const normalizedCode = normalizeStickerCode(row.sticker_code);
      const codeKey = `${row.collection_slug}:${normalizedCode ?? ''}`;
      const albumOrderKey = `${row.collection_slug}:${row.album_order}`;
      const sectionOrderKey = `${row.collection_slug}:${row.section_code}:${row.section_order}`;

      if (normalizedCode && seenCodes.has(codeKey)) {
        errors.push({
          row: rowNumber,
          code: 'DUPLICATE_NORMALIZED_CODE',
          message: 'Normalized sticker code is duplicated in the file',
        });
      }
      if (seenAlbumOrders.has(albumOrderKey)) {
        errors.push({
          row: rowNumber,
          code: 'DUPLICATE_ALBUM_ORDER',
          message: 'Sticker album order is duplicated in the collection',
        });
      }
      if (seenSectionOrders.has(sectionOrderKey)) {
        errors.push({
          row: rowNumber,
          code: 'DUPLICATE_SECTION_ORDER',
          message: 'Sticker section order is duplicated in the section',
        });
      }
      seenCodes.add(codeKey);
      seenAlbumOrders.add(albumOrderKey);
      seenSectionOrders.add(sectionOrderKey);

      report.errors.push(...errors);
      report.warnings.push(...warnings);

      if (errors.length || !normalizedCode) return;

      validRows.push({
        ...row,
        rowNumber,
        normalizedCode,
        normalizedPlayerName: row.player_name
          ? normalizeName(row.player_name)
          : undefined,
        stickerType: row.sticker_type as StickerType,
        sectionType: (row.section_type || 'OTHER') as SectionType,
        albumOrderNumber: Number(row.album_order),
        sectionOrderNumber: Number(row.section_order),
      });
    });
    report.validRows = validRows.length;
    report.invalidRows = report.totalRows - report.validRows;
    return { rows: validRows, report };
  }

  private validateRow(row: CsvRow, rowNumber: number) {
    const errors: CatalogImportReport['errors'] = [];
    const warnings: CatalogImportReport['warnings'] = [];

    const requiredValues: Header[] = [
      'collection_slug',
      'section_code',
      'sticker_code',
      'sticker_type',
      'album_order',
      'section_order',
    ];
    if (requiredValues.some((field) => !row[field])) {
      errors.push({
        row: rowNumber,
        code: 'REQUIRED_VALUE_MISSING',
        message: 'Required value is missing',
      });
    }

    if (!row.sticker_name_pt_br) {
      warnings.push({
        row: rowNumber,
        code: 'MISSING_TRANSLATION_PT_BR',
        message: 'Missing PT_BR sticker name',
      });
    }
    if (!row.sticker_name_en) {
      warnings.push({
        row: rowNumber,
        code: 'MISSING_TRANSLATION_EN',
        message: 'Missing EN sticker name',
      });
    }
    if (!row.sticker_name_es) {
      warnings.push({
        row: rowNumber,
        code: 'MISSING_TRANSLATION_ES',
        message: 'Missing ES sticker name',
      });
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.collection_slug)) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_COLLECTION_SLUG',
        message: 'Collection slug is invalid',
      });
    }
    if (!normalizeStickerCode(row.sticker_code)) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_STICKER_CODE',
        message: 'Sticker code is invalid',
      });
    }
    if (!Object.values(StickerType).includes(row.sticker_type as StickerType)) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_STICKER_TYPE',
        message: 'Sticker type is invalid',
      });
    }
    if (
      row.section_type &&
      !Object.values(SectionType).includes(row.section_type as SectionType)
    ) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_SECTION_TYPE',
        message: 'Section type is invalid',
      });
    }
    if (
      !Number.isInteger(Number(row.album_order)) ||
      Number(row.album_order) < 1
    ) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_ALBUM_ORDER',
        message: 'Album order must be a positive integer',
      });
    }
    if (
      !Number.isInteger(Number(row.section_order)) ||
      Number(row.section_order) < 1
    ) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_SECTION_ORDER',
        message: 'Section order must be a positive integer',
      });
    }
    if (row.wikidata_id && !/^Q\d+$/.test(row.wikidata_id)) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_WIKIDATA_ID',
        message: 'Wikidata ID is invalid',
      });
    }
    if (row.country_iso2 && !/^[A-Z]{2}$/.test(row.country_iso2)) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_COUNTRY_CODE',
        message: 'Country ISO2 code is invalid',
      });
    }
    for (const [field, value] of Object.entries(row)) {
      if (value.length > 500) {
        errors.push({
          row: rowNumber,
          code: 'FIELD_TOO_LONG',
          message: `${field} is too long`,
        });
      }
      if (/^[=+@]/.test(value)) {
        errors.push({
          row: rowNumber,
          code: 'UNSAFE_CSV_VALUE',
          message: `${field} contains a spreadsheet formula prefix`,
        });
      }
    }
    return { errors, warnings };
  }

  private async validateCollections(
    rows: ValidatedRow[],
    report: CatalogImportReport,
  ) {
    const slugs = [...new Set(rows.map((row) => row.collection_slug))];
    if (!slugs.length) return;
    const collections = await this.prisma.collection.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    });
    const existing = new Set(collections.map(({ slug }) => slug));
    for (const slug of slugs) {
      if (!existing.has(slug)) {
        report.errors.push({
          code: 'COLLECTION_NOT_FOUND',
          message: `Collection ${slug} does not exist`,
        });
      }
    }
    report.invalidRows = report.errors.length
      ? report.totalRows - report.validRows + 1
      : report.invalidRows;
  }

  private async applyRows(
    transaction: Prisma.TransactionClient,
    rows: ValidatedRow[],
    report: CatalogImportReport,
  ) {
    for (const row of rows) {
      const collection = await transaction.collection.findUniqueOrThrow({
        where: { slug: row.collection_slug },
      });
      let section = await transaction.collectionSection.findFirst({
        where: {
          collectionId: collection.id,
          code: row.section_code,
        },
      });
      if (!section) {
        const maximum = await transaction.collectionSection.aggregate({
          where: { collectionId: collection.id },
          _max: { order: true },
        });
        section = await transaction.collectionSection.create({
          data: {
            collectionId: collection.id,
            code: safeText(row.section_code, 80),
            type: row.sectionType,
            countryIso2: row.country_iso2
              ? safeText(row.country_iso2, 2).toUpperCase()
              : null,
            order: (maximum._max.order ?? 0) + 1,
            translations: {
              create: [
                {
                  locale: SupportedLocale.PT_BR,
                  name: safeText(
                    row.section_name_pt_br ||
                      row.section_name_en ||
                      row.section_code,
                    120,
                  ),
                },
                {
                  locale: SupportedLocale.EN,
                  name: safeText(
                    row.section_name_en ||
                      row.section_name_pt_br ||
                      row.section_code,
                    120,
                  ),
                },
                {
                  locale: SupportedLocale.ES,
                  name: safeText(
                    row.section_name_es ||
                      row.section_name_en ||
                      row.section_code,
                    120,
                  ),
                },
              ],
            },
          },
        });
        report.created.sections += 1;
      }

      const playerId = await this.resolvePlayer(transaction, row, report);
      const existing = await transaction.sticker.findUnique({
        where: {
          collectionId_normalizedCode: {
            collectionId: collection.id,
            normalizedCode: row.normalizedCode,
          },
        },
      });
      const codeMatch = row.normalizedCode.match(/^([A-Z]+)(\d+)$/)!;

      // Fallback names logic
      const fallbackName =
        row.sticker_name_pt_br ||
        row.sticker_name_en ||
        row.sticker_name_es ||
        row.sticker_code;

      const data = {
        sectionId: section.id,
        playerId,
        code: safeText(row.sticker_code, 64),
        normalizedCode: row.normalizedCode,
        prefix: codeMatch[1],
        number: Number(codeMatch[2]),
        name: safeText(fallbackName, 200), // Main name is a fallback
        type: row.stickerType,
        albumOrder: row.albumOrderNumber,
        sectionOrder: row.sectionOrderNumber,
      };

      let stickerId = '';

      if (existing) {
        await transaction.sticker.update({
          where: { id: existing.id },
          data,
        });
        stickerId = existing.id;
        report.updated.stickers += 1;
      } else {
        const created = await transaction.sticker.create({
          data: { collectionId: collection.id, ...data },
        });
        stickerId = created.id;
        report.created.stickers += 1;
      }

      // Update translations
      for (const locale of [
        SupportedLocale.PT_BR,
        SupportedLocale.EN,
        SupportedLocale.ES,
      ]) {
        let locName = row.sticker_name_en;
        if (locale === SupportedLocale.PT_BR) locName = row.sticker_name_pt_br;
        if (locale === SupportedLocale.ES) locName = row.sticker_name_es;

        const finalLocName = locName || fallbackName;

        await transaction.stickerTranslation.upsert({
          where: { stickerId_locale: { stickerId, locale } },
          update: { name: safeText(finalLocName, 200) },
          create: { stickerId, locale, name: safeText(finalLocName, 200) },
        });
      }
    }
  }

  private async previewRows(rows: ValidatedRow[], report: CatalogImportReport) {
    const seenSections = new Set<string>();
    const seenPlayers = new Set<string>();
    for (const row of rows) {
      const collection = await this.prisma.collection.findUniqueOrThrow({
        where: { slug: row.collection_slug },
        select: { id: true },
      });
      const sectionKey = `${collection.id}:${row.section_code}`;
      if (!seenSections.has(sectionKey)) {
        const section = await this.prisma.collectionSection.findFirst({
          where: {
            collectionId: collection.id,
            code: row.section_code,
          },
          select: { id: true },
        });
        if (!section) report.created.sections += 1;
        seenSections.add(sectionKey);
      }
      if (row.player_name && row.normalizedPlayerName) {
        const playerKey = row.wikidata_id
          ? `wikidata:${row.wikidata_id}`
          : `${row.normalizedPlayerName}:${row.country_iso2}`;
        if (!seenPlayers.has(playerKey)) {
          const player = row.wikidata_id
            ? await this.prisma.player.findUnique({
                where: { wikidataId: row.wikidata_id },
                select: { id: true },
              })
            : await this.prisma.player.findFirst({
                where: {
                  normalizedName: row.normalizedPlayerName,
                  countryCode: row.country_iso2 || null,
                },
                select: { id: true },
              });
          if (player) report.updated.players += 1;
          else report.created.players += 1;
          seenPlayers.add(playerKey);
        }
      }
      const sticker = await this.prisma.sticker.findUnique({
        where: {
          collectionId_normalizedCode: {
            collectionId: collection.id,
            normalizedCode: row.normalizedCode,
          },
        },
        select: { id: true },
      });
      if (sticker) report.updated.stickers += 1;
      else report.created.stickers += 1;
    }
  }

  private async resolvePlayer(
    transaction: Prisma.TransactionClient,
    row: ValidatedRow,
    report: CatalogImportReport,
  ) {
    if (!row.player_name || !row.normalizedPlayerName) return null;
    const existing = row.wikidata_id
      ? await transaction.player.findUnique({
          where: { wikidataId: row.wikidata_id },
        })
      : await transaction.player.findFirst({
          where: {
            normalizedName: row.normalizedPlayerName,
            countryCode: row.country_iso2 || null,
          },
        });
    if (existing) {
      await transaction.player.update({
        where: { id: existing.id },
        data: {
          name: safeText(row.player_name, 160),
          normalizedName: row.normalizedPlayerName,
          countryCode: row.country_iso2 || null,
          wikidataId: row.wikidata_id || existing.wikidataId,
        },
      });
      report.updated.players += 1;
      return existing.id;
    }
    const created = await transaction.player.create({
      data: {
        name: safeText(row.player_name, 160),
        normalizedName: row.normalizedPlayerName,
        countryCode: row.country_iso2 || null,
        wikidataId: row.wikidata_id || null,
      },
    });
    report.created.players += 1;
    return created.id;
  }
}

export function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function safeText(value: string, maximum: number) {
  return [...value]
    .map((character) =>
      character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
        ? ' '
        : character,
    )
    .join('')
    .trim()
    .slice(0, maximum);
}
