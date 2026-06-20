/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import {
  EnrichmentProvider,
  ImageProvider,
  ImageReviewStatus,
} from '@sticker-track/database';
import { AdminPlayersService } from './admin-players.service';

function setup() {
  const transaction = {
    player: { update: jest.fn().mockResolvedValue({ id: 'player-id' }) },
    playerImage: {
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = {
    player: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'player-id',
        name: 'Player',
        countryCode: 'NED',
      }),
      update: jest.fn(),
    },
    playerImage: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback: (client: unknown) => unknown) =>
      Promise.resolve(callback(transaction)),
    ),
  };
  const cache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    assertMinimumInterval: jest.fn().mockResolvedValue(true),
  };
  const provider = {
    searchPlayer: jest.fn().mockResolvedValue([]),
    getPlayerByExternalId: jest.fn(),
  };
  return {
    service: new AdminPlayersService(prisma as never, cache as never, provider),
    prisma,
    cache,
    provider,
    transaction,
  };
}

describe('AdminPlayersService', () => {
  it('searches and caches multiple provider candidates', async () => {
    const context = setup();
    context.provider.searchPlayer.mockResolvedValue([
      { externalId: 'Q1', name: 'One' },
      { externalId: 'Q2', name: 'Two' },
    ]);

    await expect(
      context.service.candidates('player-id', {}),
    ).resolves.toHaveLength(2);
    expect(context.cache.set).toHaveBeenCalled();
  });

  it('returns cached candidates without another provider request', async () => {
    const context = setup();
    context.cache.get.mockResolvedValue([{ externalId: 'Q1', name: 'Cached' }]);

    await expect(context.service.candidates('player-id', {})).resolves.toEqual([
      { externalId: 'Q1', name: 'Cached' },
    ]);
    expect(context.provider.searchPlayer).not.toHaveBeenCalled();
  });

  it('records that no provider candidates require manual review', async () => {
    const context = setup();

    await expect(context.service.candidates('player-id', {})).resolves.toEqual(
      [],
    );
    expect(context.prisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          enrichmentStatus: 'REVIEW_REQUIRED',
        }),
      }),
    );
  });

  it('rejects provider calls made inside the minimum interval', async () => {
    const context = setup();
    context.cache.assertMinimumInterval.mockResolvedValue(false);

    await expect(
      context.service.candidates('player-id', {}),
    ).rejects.toMatchObject({
      response: { code: 'PROVIDER_QUERY_TOO_FREQUENT' },
      status: 429,
    });
    expect(context.provider.searchPlayer).not.toHaveBeenCalled();
  });

  it('records provider errors', async () => {
    const context = setup();
    context.provider.searchPlayer.mockRejectedValue(
      new Error('PROVIDER_TIMEOUT'),
    );

    await expect(context.service.candidates('player-id', {})).rejects.toThrow(
      'PROVIDER_TIMEOUT',
    );
    expect(context.prisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ enrichmentStatus: 'FAILED' }),
      }),
    );
  });

  it('saves selected Wikidata details and a pending image', async () => {
    const context = setup();
    context.provider.getPlayerByExternalId.mockResolvedValue({
      externalId: 'Q123',
      name: 'Selected Player',
      country: 'Netherlands',
      birthDate: '2000-01-01',
      image: {
        url: 'https://upload.wikimedia.org/example.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
        author: 'Author',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
    });

    await context.service.enrich(
      'player-id',
      { provider: EnrichmentProvider.WIKIDATA, externalId: 'Q123' },
      'admin-id',
    );

    expect(context.transaction.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wikidataId: 'Q123',
          enrichmentStatus: 'APPROVED',
        }),
      }),
    );
    expect(context.transaction.playerImage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          reviewStatus: ImageReviewStatus.PENDING,
        }),
      }),
    );
  });

  it('rejects approval when attribution metadata is incomplete', async () => {
    const context = setup();
    context.prisma.playerImage.findUnique.mockResolvedValue({
      id: 'image-id',
      playerId: 'player-id',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      author: null,
      license: null,
      licenseUrl: null,
    });

    await expect(
      context.service.updateImage(
        'image-id',
        { reviewStatus: ImageReviewStatus.APPROVED },
        'admin-id',
      ),
    ).rejects.toMatchObject({
      response: { code: 'IMAGE_ATTRIBUTION_INCOMPLETE' },
    });
  });

  it('accepts an HTTPS image as pending review', async () => {
    const context = setup();
    await context.service.createImage('player-id', {
      url: 'https://upload.wikimedia.org/example.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      provider: ImageProvider.WIKIMEDIA_COMMONS,
    });
    expect(context.prisma.playerImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewStatus: ImageReviewStatus.PENDING,
        }),
      }),
    );
  });

  it('approves a fully attributed image and can make it primary', async () => {
    const context = setup();
    context.prisma.playerImage.findUnique.mockResolvedValue({
      id: 'image-id',
      playerId: 'player-id',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      author: 'Author',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    });

    await context.service.updateImage(
      'image-id',
      {
        reviewStatus: ImageReviewStatus.APPROVED,
        isPrimary: true,
      },
      'admin-id',
    );

    expect(context.transaction.playerImage.updateMany).toHaveBeenCalledWith({
      where: { playerId: 'player-id' },
      data: { isPrimary: false },
    });
    expect(context.transaction.playerImage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewStatus: ImageReviewStatus.APPROVED,
          isPrimary: true,
          reviewedById: 'admin-id',
        }),
      }),
    );
  });

  it('rejects an image and clears its primary status', async () => {
    const context = setup();
    context.prisma.playerImage.findUnique.mockResolvedValue({
      id: 'image-id',
      playerId: 'player-id',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
      author: null,
      license: null,
      licenseUrl: null,
    });

    await context.service.updateImage(
      'image-id',
      { reviewStatus: ImageReviewStatus.REJECTED },
      'admin-id',
    );

    expect(context.transaction.playerImage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewStatus: ImageReviewStatus.REJECTED,
          isPrimary: false,
        }),
      }),
    );
  });

  it('rejects non-HTTPS external image URLs', () => {
    const context = setup();

    expect(() =>
      context.service.createImage('player-id', {
        url: 'http://example.com/image.jpg',
        sourceUrl: 'https://example.com/source',
        provider: ImageProvider.OTHER,
      }),
    ).toThrow(BadRequestException);
    expect(context.prisma.playerImage.create).not.toHaveBeenCalled();
  });
});
