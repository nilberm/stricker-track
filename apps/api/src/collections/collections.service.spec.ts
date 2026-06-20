import type { PrismaService } from '../prisma/prisma.service';
import { CollectionsService } from './collections.service';

describe('CollectionsService', () => {
  it('lists only published collections and maps localized content', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'collection-id',
        slug: 'demo',
        releaseYear: 2026,
        publisherName: null,
        totalStickers: 30,
        status: 'PUBLISHED',
        codePattern: null,
        codeExample: 'NTH 01',
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [
          { name: 'Demo Collection', description: 'Localized description' },
        ],
        _count: { sections: 4, stickers: 30 },
      },
    ]);
    const prisma = {
      collection: { findMany },
    } as unknown as PrismaService;
    const service = new CollectionsService(prisma);

    const result = await service.listPublished('en');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED' } }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        slug: 'demo',
        name: 'Demo Collection',
        sectionCount: 4,
        stickerCount: 30,
      }),
    ]);
  });
});
