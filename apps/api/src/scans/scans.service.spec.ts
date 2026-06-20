import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ScanSource, ScanStatus } from '@sticker-track/database';
import type { PrismaService } from '../prisma/prisma.service';
import { ScansService } from './scans.service';

describe('ScansService resolve', () => {
  it('saves a matching scan without changing quantity', async () => {
    const context = resolvePrisma([
      {
        id: 'sticker-id',
        code: 'NTH 01',
        normalizedCode: 'NTH1',
        name: 'Demo Athlete',
        type: 'PLAYER',
        section: { id: 'section-id', code: 'NTH', translations: [] },
        player: null,
        userStickers: [{ quantity: 1 }],
      },
    ]);
    const service = new ScansService(context.prisma);

    const result = await service.resolve(
      'user-id',
      'collection-id',
      { rawText: 'nth-01', source: ScanSource.MANUAL },
      'en',
    );

    expect(result).toEqual(
      expect.objectContaining({
        scanId: 'scan-id',
        normalizedCode: 'NTH1',
        matched: true,
        sticker: expect.objectContaining({
          code: 'NTH 01',
          currentQuantity: 1,
          quantityAfterConfirmation: 2,
        }) as unknown,
      }),
    );
    expect(context.createScan).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: ScanStatus.CONFIRMATION_REQUIRED,
        normalizedCode: 'NTH1',
        stickerId: 'sticker-id',
      }) as unknown,
    });
    expect(context.prisma.userSticker).toBeUndefined();
  });

  it('saves a valid code that was not found', async () => {
    const context = resolvePrisma([]);
    const service = new ScansService(context.prisma);

    await expect(
      service.resolve(
        'user-id',
        'collection-id',
        { rawText: 'NTH 99', source: ScanSource.MANUAL },
        'en',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        matched: false,
        normalizedCode: 'NTH99',
        errorCode: 'STICKER_CODE_NOT_FOUND',
      }),
    );
    expect(context.createScan).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: ScanStatus.NOT_FOUND,
      }) as unknown,
    });
  });

  it('saves an invalid code', async () => {
    const context = resolvePrisma([]);
    const service = new ScansService(context.prisma);

    await expect(
      service.resolve(
        'user-id',
        'collection-id',
        { rawText: 'invalid', source: ScanSource.MANUAL },
        'en',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        matched: false,
        resultState: 'STICKER_CODE_INVALID',
        errorCode: 'STICKER_CODE_INVALID',
      }),
    );
    expect(context.createScan).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: ScanStatus.INVALID }) as unknown,
    });
  });

  it('rejects a missing collection', async () => {
    const context = resolvePrisma([]);
    context.findCollection.mockResolvedValue(null);
    const service = new ScansService(context.prisma);

    await expect(
      service.resolve(
        'user-id',
        'collection-id',
        { rawText: 'NTH 01', source: ScanSource.MANUAL },
        'en',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a collection not owned by the current user', async () => {
    const context = resolvePrisma([]);
    context.findUserCollection.mockResolvedValue(null);
    const service = new ScansService(context.prisma);

    await expect(
      service.resolve(
        'user-id',
        'collection-id',
        { rawText: 'NTH 01', source: ScanSource.MANUAL },
        'en',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('stores camera metadata without receiving an image', async () => {
    const context = resolvePrisma([
      {
        id: 'sticker-id',
        code: 'NTH 01',
        normalizedCode: 'NTH1',
        name: 'Demo Athlete',
        type: 'PLAYER',
        section: null,
        player: null,
        userStickers: [],
      },
    ]);
    const service = new ScansService(context.prisma);

    await service.resolve(
      'user-id',
      'collection-id',
      {
        rawText: 'LOT 123\nNTH O1',
        source: ScanSource.CAMERA,
        ocrConfidence: 0.88,
        selectedCandidate: 'NTH1',
        candidates: [
          {
            value: 'NTH1',
            confidence: 0.92,
            corrections: ['O->0'],
          },
        ],
      },
      'en',
    );

    expect(context.createScan).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: ScanSource.CAMERA,
        rawText: 'LOT 123\nNTH O1',
        ocrRawText: 'LOT 123\nNTH O1',
        selectedCandidate: 'NTH1',
        confidence: 0.92,
        corrections: ['O->0'],
      }) as unknown,
    });
  });

  it('rejects a selected candidate that was not submitted', async () => {
    const context = resolvePrisma([]);
    const service = new ScansService(context.prisma);

    await expect(
      service.resolve(
        'user-id',
        'collection-id',
        {
          rawText: 'NTH O1',
          source: ScanSource.CAMERA,
          selectedCandidate: 'NTH99',
          candidates: [{ value: 'NTH1' }],
        },
        'en',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns only catalog matches when OCR submits multiple candidates', async () => {
    const context = resolvePrisma([
      {
        id: 'sticker-one',
        code: 'NTH 01',
        normalizedCode: 'NTH1',
        name: 'First sticker',
        type: 'PLAYER',
        section: null,
        player: null,
        userStickers: [],
      },
      {
        id: 'sticker-two',
        code: 'NTH 02',
        normalizedCode: 'NTH2',
        name: 'Second sticker',
        type: 'PLAYER',
        section: null,
        player: null,
        userStickers: [],
      },
    ]);
    const service = new ScansService(context.prisma);

    await expect(
      service.resolve(
        'user-id',
        'collection-id',
        {
          rawText: 'NTH 01 NTH 02 NTH 99',
          source: ScanSource.CAMERA,
          candidates: [
            { value: 'NTH1' },
            { value: 'NTH2' },
            { value: 'NTH99' },
          ],
        },
        'en',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        matched: false,
        requiresConfirmation: true,
        candidateMatches: [
          expect.objectContaining({ normalizedCode: 'NTH1' }),
          expect.objectContaining({ normalizedCode: 'NTH2' }),
        ],
      }),
    );
  });
});

describe('ScansService validateCandidates', () => {
  it('normalizes candidates and returns only catalog matches', async () => {
    const context = resolvePrisma([]);
    const findFirst = jest.fn().mockResolvedValue({
      codePattern: null,
      codeExample: 'NTH 01',
      codePrefixMinLength: 3,
      codePrefixMaxLength: 3,
      codeNumberMinLength: 1,
      codeNumberMaxLength: 2,
    });
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'sticker-id',
        code: 'NTH 01',
        normalizedCode: 'NTH1',
        name: 'Test sticker',
      },
    ]);
    Object.assign(context.prisma.collection, { findFirst });
    Object.assign(context.prisma.sticker, { findMany });
    const service = new ScansService(context.prisma);

    await expect(
      service.validateCandidates('user-id', 'collection-id', [
        { value: 'NTH 01' },
        { value: 'NTH1' },
      ]),
    ).resolves.toEqual({
      matches: [
        expect.objectContaining({
          normalizedCode: 'NTH1',
        }),
      ],
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        collectionId: 'collection-id',
        normalizedCode: { in: ['NTH1'] },
      },
      select: {
        id: true,
        code: true,
        normalizedCode: true,
        name: true,
      },
    });
    expect(context.createScan).not.toHaveBeenCalled();
  });
});

describe('ScansService confirm', () => {
  it('increments once, updates duplicates and returns progress', async () => {
    const transaction = confirmTransaction();
    const service = new ScansService(transactionPrisma(transaction));

    await expect(
      service.confirm(
        'user-id',
        'user-collection-id',
        'scan-id',
        'sticker-id',
        1,
      ),
    ).resolves.toEqual({
      scanId: 'scan-id',
      sticker: {
        id: 'sticker-id',
        code: 'NTH 01',
        previousQuantity: 1,
        newQuantity: 2,
        duplicateCount: 1,
      },
      progress: {
        ownedUnique: 1,
        missing: 29,
        duplicates: 1,
        percentage: 3.33,
      },
    });
    const [claimInput] = transaction.stickerScan.updateMany.mock
      .calls[0] as unknown as [{ data: { status: ScanStatus } }];
    expect(claimInput.data.status).toBe(ScanStatus.CONFIRMED);
    expect(transaction.userSticker.upsert).toHaveBeenCalledTimes(1);
  });

  it('rejects an already confirmed scan', async () => {
    const transaction = confirmTransaction();
    transaction.stickerScan.updateMany.mockResolvedValue({ count: 0 });
    const service = new ScansService(transactionPrisma(transaction));

    await expect(
      service.confirm(
        'user-id',
        'user-collection-id',
        'scan-id',
        'sticker-id',
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.userSticker.upsert).not.toHaveBeenCalled();
  });

  it('rejects a scan owned by another user', async () => {
    const transaction = confirmTransaction();
    transaction.userCollection.findUnique.mockResolvedValue({
      ...ownedCollection,
      userId: 'another-user',
    });
    const service = new ScansService(transactionPrisma(transaction));

    await expect(
      service.confirm(
        'user-id',
        'user-collection-id',
        'scan-id',
        'sticker-id',
        1,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a different sticker from the resolved scan', async () => {
    const transaction = confirmTransaction();
    const service = new ScansService(transactionPrisma(transaction));

    await expect(
      service.confirm(
        'user-id',
        'user-collection-id',
        'scan-id',
        'different-sticker',
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows only one concurrent confirmation', async () => {
    const transaction = confirmTransaction();
    let claimed = false;
    transaction.stickerScan.updateMany.mockImplementation(() => {
      if (claimed) return Promise.resolve({ count: 0 });
      claimed = true;
      return Promise.resolve({ count: 1 });
    });
    const service = new ScansService(transactionPrisma(transaction));
    const confirmations = await Promise.allSettled([
      service.confirm(
        'user-id',
        'user-collection-id',
        'scan-id',
        'sticker-id',
        1,
      ),
      service.confirm(
        'user-id',
        'user-collection-id',
        'scan-id',
        'sticker-id',
        1,
      ),
    ]);

    expect(
      confirmations.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      confirmations.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(transaction.userSticker.upsert).toHaveBeenCalledTimes(1);
  });
});

const ownedCollection = {
  id: 'user-collection-id',
  userId: 'user-id',
  collectionId: 'collection-id',
  collection: { totalStickers: 30 },
};

function resolvePrisma(stickers: unknown[]) {
  const findCollection = jest.fn().mockResolvedValue({
    id: 'collection-id',
    status: 'PUBLISHED',
    codePattern: null,
    codeExample: 'NTH 01',
    codePrefixMinLength: 3,
    codePrefixMaxLength: 3,
    codeNumberMinLength: 1,
    codeNumberMaxLength: 2,
  });
  const findUserCollection = jest
    .fn()
    .mockResolvedValue({ id: 'user-collection-id' });
  const createScan = jest.fn().mockResolvedValue({ id: 'scan-id' });
  const prisma = {
    collection: {
      findUnique: findCollection,
    },
    userCollection: {
      findUnique: findUserCollection,
    },
    sticker: { findMany: jest.fn().mockResolvedValue(stickers) },
    stickerScan: {
      create: createScan,
    },
  } as unknown as PrismaService;
  return { prisma, findCollection, findUserCollection, createScan };
}

function confirmTransaction() {
  return {
    userCollection: {
      findUnique: jest.fn().mockResolvedValue(ownedCollection),
    },
    stickerScan: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'scan-id',
        userId: 'user-id',
        userCollectionId: 'user-collection-id',
        collectionId: 'collection-id',
        stickerId: 'sticker-id',
        status: ScanStatus.CONFIRMATION_REQUIRED,
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    userSticker: {
      findUnique: jest.fn().mockResolvedValue({ quantity: 1 }),
      upsert: jest.fn().mockResolvedValue({
        stickerId: 'sticker-id',
        quantity: 2,
        sticker: { code: 'NTH 01' },
      }),
      findMany: jest.fn().mockResolvedValue([{ quantity: 2 }]),
    },
  };
}

function transactionPrisma<T>(transaction: T) {
  const execute = async (callback: (value: T) => Promise<unknown>) =>
    callback(transaction);
  return { $transaction: jest.fn(execute) } as unknown as PrismaService;
}
