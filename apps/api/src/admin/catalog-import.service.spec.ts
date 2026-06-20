import { CatalogImportService } from './catalog-import.service';

const header =
  'collection_slug,collection_name_pt_br,collection_name_en,collection_name_es,section_code,section_type,section_name_pt_br,section_name_en,section_name_es,sticker_code,sticker_type,sticker_name_pt_br,sticker_name_en,sticker_name_es,album_order,section_order,player_name,country_iso2,wikidata_id';

function csv(...rows: string[]) {
  return [header, ...rows].join('\n');
}

function prismaMock() {
  const transaction = {
    collection: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'collection-id' }),
    },
    collectionSection: {
      findFirst: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue({ _max: { order: 0 } }),
      create: jest.fn().mockResolvedValue({ id: 'section-id' }),
    },
    player: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'player-id' }),
      update: jest.fn(),
    },
    sticker: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'sticker-id' }),
      update: jest.fn(),
    },
    stickerTranslation: {
      upsert: jest.fn(),
    },
  };
  const prisma = {
    collection: {
      findMany: jest.fn().mockResolvedValue([{ slug: 'world-cup-2026' }]),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'collection-id' }),
    },
    collectionSection: { findFirst: jest.fn().mockResolvedValue(null) },
    player: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    sticker: { findUnique: jest.fn().mockResolvedValue(null) },
    catalogImport: {
      create: jest.fn().mockResolvedValue({ id: 'import-id' }),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback: (client: unknown) => unknown) =>
      Promise.resolve(callback(transaction)),
    ),
  };
  return { prisma, transaction };
}

describe('CatalogImportService', () => {
  it('validates a valid CSV without writing', async () => {
    const { prisma } = prismaMock();
    const service = new CatalogImportService(prisma as never);
    const report = await service.validate({
      fileName: 'catalog.csv',
      csv: csv(
        'world-cup-2026,Copa 26,Cup 26,Copa 26,NED,NATIONAL_TEAM,Holanda,Netherlands,Paises Bajos,NED 19,PLAYER,Player,Player,Player,19,19,Player,NL,',
      ),
    });

    expect(report.validRows).toBe(1);
    expect(report.errors).toEqual([]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects malformed headers and duplicate normalized codes', async () => {
    const { prisma } = prismaMock();
    const service = new CatalogImportService(prisma as never);
    const malformed = await service.validate({
      fileName: 'catalog.csv',
      csv: 'wrong,header\none,two',
    });
    const duplicate = await service.validate({
      fileName: 'catalog.csv',
      csv: csv(
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,One,One,One,19,19,One,NL,',
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED-019,PLAYER,Two,Two,Two,20,20,Two,NL,',
      ),
    });

    expect(malformed.errors[0]?.code).toBe('MALFORMED_CSV');
    expect(duplicate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DUPLICATE_NORMALIZED_CODE' }),
      ]),
    );
  });

  it('rejects duplicate orders, invalid types, and unsafe CSV values', async () => {
    const { prisma } = prismaMock();
    const service = new CatalogImportService(prisma as never);
    const duplicateOrder = await service.validate({
      fileName: 'catalog.csv',
      csv: csv(
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,One,One,One,19,19,One,NL,',
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 20,PLAYER,Two,Two,Two,19,19,Two,NL,',
      ),
    });
    const invalidType = await service.validate({
      fileName: 'catalog.csv',
      csv: csv(
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 21,UNKNOWN,Item,Item,Item,21,21,,,',
      ),
    });
    const unsafeValue = await service.validate({
      fileName: 'catalog.csv',
      csv: csv(
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 22,PLAYER,=HYPERLINK,Player,Player,22,22,Player,NL,',
      ),
    });

    expect(duplicateOrder.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DUPLICATE_ALBUM_ORDER' }),
      ]),
    );
    expect(invalidType.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'INVALID_STICKER_TYPE' }),
      ]),
    );
    expect(unsafeValue.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'UNSAFE_CSV_VALUE' }),
      ]),
    );
  });

  it('generates translation warnings for missing localized sticker names', async () => {
    const { prisma } = prismaMock();
    const service = new CatalogImportService(prisma as never);
    const report = await service.validate({
      fileName: 'catalog.csv',
      csv: csv(
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,,,Name,19,19,Player,NL,',
      ),
    });

    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_TRANSLATION_PT_BR' }),
        expect.objectContaining({ code: 'MISSING_TRANSLATION_EN' }),
      ]),
    );
  });

  it('rejects CSV payloads above the configured byte limit', async () => {
    const { prisma } = prismaMock();
    const config = {
      get: jest.fn((key: string) => (key === 'CSV_MAX_BYTES' ? 32 : 10_000)),
    };
    const service = new CatalogImportService(prisma as never, config as never);
    const report = await service.validate({
      fileName: 'catalog.csv',
      csv: csv(
        'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,Player,Player,Player,19,19,Player,NL,',
      ),
    });

    expect(report.errors[0]?.code).toBe('CSV_TOO_LARGE');
  });

  it('keeps dry-run read-only', async () => {
    const { prisma } = prismaMock();
    const service = new CatalogImportService(prisma as never);
    const result = await service.execute(
      {
        fileName: 'catalog.csv',
        csv: csv(
          'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,Player,Player,Player,19,19,Player,NL,',
        ),
        dryRun: true,
      },
      'admin-id',
    );

    expect(result.importId).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.catalogImport.create).not.toHaveBeenCalled();
  });

  it('creates missing section, player, sticker and translations in one transaction', async () => {
    const { prisma, transaction } = prismaMock();
    const service = new CatalogImportService(prisma as never);
    const result = await service.execute(
      {
        fileName: 'catalog.csv',
        csv: csv(
          'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,Player,Player,Player,19,19,Player,NL,',
        ),
      },
      'admin-id',
    );

    expect(result.importId).toBe('import-id');
    expect(transaction.collectionSection.create).toHaveBeenCalled();
    expect(transaction.player.create).toHaveBeenCalled();
    expect(transaction.sticker.create).toHaveBeenCalled();
    expect(transaction.stickerTranslation.upsert).toHaveBeenCalledTimes(3);
  });

  it('updates existing records without duplicating them', async () => {
    const { prisma, transaction } = prismaMock();
    transaction.collectionSection.findFirst.mockResolvedValue({
      id: 'section-id',
    });
    transaction.player.findFirst.mockResolvedValue({ id: 'player-id' });
    transaction.sticker.findUnique.mockResolvedValue({ id: 'sticker-id' });
    const service = new CatalogImportService(prisma as never);
    const result = await service.execute(
      {
        fileName: 'catalog.csv',
        csv: csv(
          'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,Player,Player,Player,19,19,Player,NL,',
        ),
      },
      'admin-id',
    );

    expect(result.report.updated.stickers).toBe(1);
    expect(transaction.sticker.create).not.toHaveBeenCalled();
    expect(transaction.sticker.update).toHaveBeenCalled();
    expect(transaction.stickerTranslation.upsert).toHaveBeenCalled();
  });

  it('does not create an audit record when the transaction rolls back', async () => {
    const { prisma } = prismaMock();
    prisma.$transaction.mockRejectedValue(new Error('database failed'));
    const service = new CatalogImportService(prisma as never);

    await expect(
      service.execute(
        {
          fileName: 'catalog.csv',
          csv: csv(
            'world-cup-2026,Copa,Cup,Copa,NED,NATIONAL_TEAM,Holanda,Netherlands,Holanda,NED 19,PLAYER,Player,Player,Player,19,19,Player,NL,',
          ),
        },
        'admin-id',
      ),
    ).rejects.toThrow('database failed');
    expect(prisma.catalogImport.create).not.toHaveBeenCalled();
  });
});
