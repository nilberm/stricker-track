import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { UserCollectionsService } from './user-collections.service';

describe('UserCollectionsService', () => {
  it('rejects access to a collection owned by another user', async () => {
    const prisma = {
      userCollection: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-collection-id',
          userId: 'another-user',
          collection: { translations: [] },
        }),
      },
    } as unknown as PrismaService;
    const service = new UserCollectionsService(prisma);

    await expect(
      service.find('current-user', 'user-collection-id', 'en'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('uses an atomic increment operation', async () => {
    const transaction = {
      userCollection: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-id',
          collectionId: 'collection-id',
        }),
      },
      sticker: { count: jest.fn().mockResolvedValue(1) },
      userSticker: {
        upsert: jest.fn().mockResolvedValue({
          stickerId: 'sticker-id',
          quantity: 2,
        }),
      },
    };
    const prisma = transactionPrisma(transaction);
    const service = new UserCollectionsService(prisma);

    await expect(
      service.increment('user-id', 'user-collection-id', 'sticker-id', 1),
    ).resolves.toEqual({
      stickerId: 'sticker-id',
      quantity: 2,
      owned: true,
      duplicateCount: 1,
    });
    const [upsertInput] = transaction.userSticker.upsert.mock
      .calls[0] as unknown as [{ update: { quantity: { increment: number } } }];
    expect(upsertInput.update.quantity.increment).toBe(1);
  });

  it('deletes the sparse quantity record when decrement reaches zero', async () => {
    const transaction = mutationTransaction({ quantity: 1 });
    const prisma = transactionPrisma(transaction);
    const service = new UserCollectionsService(prisma);

    await expect(
      service.decrement('user-id', 'user-collection-id', 'sticker-id', 1),
    ).resolves.toEqual({
      stickerId: 'sticker-id',
      quantity: 0,
      owned: false,
      duplicateCount: 0,
    });
    expect(transaction.userSticker.deleteMany).toHaveBeenCalledWith({
      where: {
        userCollectionId: 'user-collection-id',
        stickerId: 'sticker-id',
      },
    });
  });

  it('does not allow a decrement below zero', async () => {
    const transaction = mutationTransaction(null);
    const prisma = transactionPrisma(transaction);
    const service = new UserCollectionsService(prisma);

    await expect(
      service.decrement('user-id', 'user-collection-id', 'sticker-id', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.userSticker.deleteMany).not.toHaveBeenCalled();
  });
});

function mutationTransaction(record: { quantity: number } | null) {
  return {
    userCollection: {
      findUnique: jest.fn().mockResolvedValue({
        userId: 'user-id',
        collectionId: 'collection-id',
      }),
    },
    sticker: { count: jest.fn().mockResolvedValue(1) },
    userSticker: {
      findUnique: jest.fn().mockResolvedValue(record),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn(),
    },
  };
}

function transactionPrisma<T>(transaction: T) {
  const execute = async (callback: (value: T) => Promise<unknown>) =>
    callback(transaction);
  return { $transaction: jest.fn(execute) } as unknown as PrismaService;
}
