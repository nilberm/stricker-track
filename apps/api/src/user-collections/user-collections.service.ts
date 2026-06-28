import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ImageReviewStatus,
  Prisma,
  SupportedLocale,
  CollectionStatus,
} from '@sticker-track/database';
import {
  localeToDatabase,
  normalizeStickerCode,
  type Locale,
} from '@sticker-track/shared';
import { StickerSort } from '../collections/dto/list-stickers.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListUserStickersDto,
  PersonalStickerStatus,
} from './dto/user-collection.dto';
import { calculateProgress } from './progress';

@Injectable()
export class UserCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, status: CollectionStatus.PUBLISHED },
      select: { id: true },
    });
    if (!collection) {
      throw new BadRequestException({
        code: 'COLLECTION_NOT_PUBLISHED',
        message: 'Collection is not published',
      });
    }

    return this.prisma.userCollection.upsert({
      where: { userId_collectionId: { userId, collectionId } },
      update: {},
      create: { userId, collectionId },
    });
  }

  async list(userId: string, locale: Locale) {
    const userCollections = await this.prisma.userCollection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        collection: {
          include: {
            translations: this.translationFilter(locale),
            sections: { select: { _count: { select: { stickers: true } } } },
          },
        },
        userStickers: { select: { quantity: true } },
      },
    });

    return userCollections.map((entry) => {
      const totalStickers =
        entry.collection.sections?.reduce(
          (sum, s) => sum + s._count.stickers,
          0,
        ) ?? 0;
      return {
        id: entry.id,
        startedAt: entry.startedAt,
        updatedAt: entry.updatedAt,
        collection: {
          id: entry.collection.id,
          slug: entry.collection.slug,
          name: entry.collection.translations[0]?.name ?? entry.collection.slug,
          totalStickers: totalStickers,
          releaseYear: entry.collection.releaseYear,
        },
        progress: calculateProgress(totalStickers, entry.userStickers),
      };
    });
  }

  async listPublic(locale: Locale) {
    const userCollections = await this.prisma.userCollection.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true } },
        collection: {
          include: {
            translations: this.translationFilter(locale),
            sections: { select: { _count: { select: { stickers: true } } } },
          },
        },
        userStickers: { select: { quantity: true } },
      },
    });

    return userCollections.map((entry) => {
      const totalStickers =
        entry.collection.sections?.reduce(
          (sum, s) => sum + s._count.stickers,
          0,
        ) ?? 0;
      return {
        id: entry.id,
        updatedAt: entry.updatedAt,
        user: {
          id: entry.user.id,
          name: entry.user.name,
        },
        collection: {
          id: entry.collection.id,
          name: entry.collection.translations[0]?.name ?? entry.collection.slug,
          totalStickers,
        },
        progress: calculateProgress(totalStickers, entry.userStickers),
      };
    });
  }

  async find(userId: string, userCollectionId: string, locale: Locale) {
    const entry = await this.requireOwnedCollection(
      userId,
      userCollectionId,
      locale,
    );
    const knownCodePrefixes = await this.prisma.sticker.findMany({
      where: { collectionId: entry.collectionId, prefix: { not: null } },
      distinct: ['prefix'],
      select: { prefix: true },
      orderBy: { prefix: 'asc' },
    });
    return {
      id: entry.id,
      startedAt: entry.startedAt,
      updatedAt: entry.updatedAt,
      isPublic: entry.isPublic,
      collection: {
        id: entry.collection.id,
        slug: entry.collection.slug,
        name: entry.collection.translations[0]?.name ?? entry.collection.slug,
        description: entry.collection.translations[0]?.description ?? null,
        totalStickers:
          entry.collection.sections?.reduce(
            (sum, s) => sum + s._count.stickers,
            0,
          ) ?? 0,
        releaseYear: entry.collection.releaseYear,
        codeConfig: {
          pattern: entry.collection.codePattern,
          example: entry.collection.codeExample,
          prefixMinLength: entry.collection.codePrefixMinLength,
          prefixMaxLength: entry.collection.codePrefixMaxLength,
          numberMinLength: entry.collection.codeNumberMinLength,
          numberMaxLength: entry.collection.codeNumberMaxLength,
        },
        knownCodePrefixes: knownCodePrefixes
          .map(({ prefix }) => prefix)
          .filter((prefix): prefix is string => Boolean(prefix)),
      },
    };
  }

  async findPublic(userCollectionId: string, locale: Locale) {
    const entry = await this.prisma.userCollection.findUnique({
      where: { id: userCollectionId, isPublic: true },
      include: {
        user: { select: { id: true, name: true } },
        collection: {
          include: {
            translations: this.translationFilter(locale),
            sections: { select: { _count: { select: { stickers: true } } } },
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException({
        code: 'USER_COLLECTION_NOT_FOUND',
        message: 'Public user collection not found',
      });
    }

    const knownCodePrefixes = await this.prisma.sticker.findMany({
      where: { collectionId: entry.collectionId, prefix: { not: null } },
      distinct: ['prefix'],
      select: { prefix: true },
      orderBy: { prefix: 'asc' },
    });
    
    return {
      id: entry.id,
      startedAt: entry.startedAt,
      updatedAt: entry.updatedAt,
      isPublic: entry.isPublic,
      user: {
        id: entry.user.id,
        name: entry.user.name,
      },
      collection: {
        id: entry.collection.id,
        slug: entry.collection.slug,
        name: entry.collection.translations[0]?.name ?? entry.collection.slug,
        description: entry.collection.translations[0]?.description ?? null,
        totalStickers:
          entry.collection.sections?.reduce(
            (sum, s) => sum + s._count.stickers,
            0,
          ) ?? 0,
        releaseYear: entry.collection.releaseYear,
        codeConfig: {
          pattern: entry.collection.codePattern,
          example: entry.collection.codeExample,
          prefixMinLength: entry.collection.codePrefixMinLength,
          prefixMaxLength: entry.collection.codePrefixMaxLength,
          numberMinLength: entry.collection.codeNumberMinLength,
          numberMaxLength: entry.collection.codeNumberMaxLength,
        },
        knownCodePrefixes: knownCodePrefixes
          .map(({ prefix }) => prefix)
          .filter((prefix): prefix is string => Boolean(prefix)),
      },
    };
  }

  async progress(userId: string, userCollectionId: string, locale: Locale) {
    const entry = await this.requireOwnedCollection(
      userId,
      userCollectionId,
      locale,
    );
    const [sections, recent] = await Promise.all([
      this.prisma.collectionSection.findMany({
        where: { collectionId: entry.collectionId },
        orderBy: { order: 'asc' },
        include: {
          translations: this.translationFilter(locale),
          stickers: {
            select: {
              id: true,
              albumOrder: true,
              userStickers: {
                where: { userCollectionId },
                select: { quantity: true },
              },
            },
          },
        },
      }),
      this.prisma.userSticker.findMany({
        where: { userCollectionId, quantity: { gt: 0 } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: {
          sticker: {
            include: {
              section: {
                include: { translations: this.translationFilter(locale) },
              },
            },
          },
        },
      }),
    ]);

    const mappedSections = sections.map((section) => {
      const sectionRecords = section.stickers
        .map((sticker) => sticker.userStickers[0])
        .filter((record): record is { quantity: number } => Boolean(record));
      const summary = calculateProgress(
        section.stickers.length,
        sectionRecords,
      );
      return {
        sectionId: section.id,
        code: section.code,
        type: section.type,
        countryIso2: section.countryIso2 ?? undefined,
        name: section.translations[0]?.name ?? section.code ?? '',
        total: summary.totalStickers,
        owned: summary.ownedUnique,
        missing: summary.missing,
        duplicates: summary.duplicates,
        percentage: summary.completionPercentage,
        minAlbumOrder: section.stickers.length > 0 
          ? Math.min(...section.stickers.map(s => s.albumOrder))
          : Infinity,
      };
    }).sort((a, b) => a.minAlbumOrder - b.minAlbumOrder);

    const totalStickers = mappedSections.reduce((sum, s) => sum + s.total, 0);
    const ownedUnique = mappedSections.reduce((sum, s) => sum + s.owned, 0);
    const missing = mappedSections.reduce((sum, s) => sum + s.missing, 0);
    const duplicates = mappedSections.reduce((sum, s) => sum + s.duplicates, 0);
    const completionPercentage =
      totalStickers > 0 ? Math.round((ownedUnique / totalStickers) * 100) : 0;

    return {
      totalStickers,
      ownedUnique,
      missing,
      duplicates,
      completionPercentage,
      sections: mappedSections,
      recent: recent.map((record) => ({
        stickerId: record.stickerId,
        code: record.sticker.code,
        name: record.sticker.name,
        quantity: record.quantity,
        updatedAt: record.updatedAt,
        section:
          record.sticker.section?.translations[0]?.name ??
          record.sticker.section?.code ??
          null,
      })),
    };
  }

  async getMatch(
    userId: string,
    visitorCollectionId: string,
    targetCollectionId: string,
    locale: Locale,
  ) {
    const visitorEntry = await this.requireOwnedCollection(userId, visitorCollectionId, locale);
    
    // We don't require the target collection to be owned by the user, but it should be public.
    const targetEntry = await this.prisma.userCollection.findUnique({
      where: { id: targetCollectionId, isPublic: true },
    });
    
    if (!targetEntry) {
      throw new NotFoundException('Target collection not found or not public');
    }

    if (visitorEntry.collectionId !== targetEntry.collectionId) {
      throw new BadRequestException('Cannot match different collections');
    }

    // Get all stickers with both users' quantities
    const allStickers = await this.prisma.sticker.findMany({
      where: { collectionId: visitorEntry.collectionId },
      include: {
        section: { include: { translations: this.translationFilter(locale) } },
        player: true,
        userStickers: {
          where: { userCollectionId: { in: [visitorCollectionId, targetCollectionId] } },
        },
      },
      orderBy: { albumOrder: 'asc' },
    });

    const visitorCanGive = [];
    const targetCanGive = [];

    for (const sticker of allStickers) {
      const visitorRecord = sticker.userStickers.find(us => us.userCollectionId === visitorCollectionId);
      const targetRecord = sticker.userStickers.find(us => us.userCollectionId === targetCollectionId);
      
      const visitorQty = visitorRecord?.quantity ?? 0;
      const targetQty = targetRecord?.quantity ?? 0;
      
      const stickerInfo = {
        id: sticker.id,
        code: sticker.code,
        name: sticker.name,
        type: sticker.type,
        albumOrder: sticker.albumOrder,
        section: sticker.section ? {
          id: sticker.section.id,
          name: sticker.section.translations[0]?.name ?? sticker.section.code ?? '',
        } : null,
        player: sticker.player ? { name: sticker.player.name } : null,
      };

      if (visitorQty > 1 && targetQty === 0) {
        visitorCanGive.push({
          ...stickerInfo,
          tradeWeight: visitorRecord?.tradeWeight ?? 1,
        });
      }

      if (targetQty > 1 && visitorQty === 0) {
        targetCanGive.push({
          ...stickerInfo,
          tradeWeight: targetRecord?.tradeWeight ?? 1,
        });
      }
    }

    return {
      visitorCanGive,
      targetCanGive,
    };
  }

  async listStickers(
    userId: string,
    userCollectionId: string,
    query: ListUserStickersDto,
  ) {
    const entry = await this.requireOwnedCollection(
      userId,
      userCollectionId,
      query.locale,
    );
    if (query.sectionId) {
      const sectionExists = await this.prisma.collectionSection.findUnique({
        where: { id: query.sectionId },
        select: { collectionId: true },
      });
      if (!sectionExists || sectionExists.collectionId !== entry.collectionId) {
        throw new NotFoundException('Section not found in this collection');
      }
    }
    const quantityFilter = this.quantityFilter(query.status);
    const normalizedSearch = query.search
      ? normalizeStickerCode(query.search)
      : null;
    const where: Prisma.StickerWhereInput = {
      collectionId: entry.collectionId,
      ...(query.sectionId ? { sectionId: query.sectionId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              ...(normalizedSearch
                ? [{ normalizedCode: normalizedSearch }]
                : []),
              { name: { contains: query.search, mode: 'insensitive' } },
              {
                player: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(quantityFilter
        ? {
            userStickers: {
              [quantityFilter.operator]: {
                userCollectionId,
                quantity: quantityFilter.quantity,
              },
            },
          }
        : {}),
    };
    const orderBy: Prisma.StickerOrderByWithRelationInput =
      query.sort === StickerSort.CODE
        ? { code: 'asc' }
        : query.sort === StickerSort.NAME
          ? { name: 'asc' }
          : { albumOrder: 'asc' };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.sticker.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          section: {
            include: { translations: this.translationFilter(query.locale) },
          },
          player: {
            include: {
              images: {
                where: {
                  isPrimary: true,
                  reviewStatus: ImageReviewStatus.APPROVED,
                },
                take: 1,
              },
            },
          },
          userStickers: {
            where: { userCollectionId },
            take: 1,
          },
        },
      }),
      this.prisma.sticker.count({ where }),
    ]);

    return {
      data: data.map((sticker) => {
        const quantity = sticker.userStickers[0]?.quantity ?? 0;
        return {
          id: sticker.id,
          code: sticker.code,
          name: sticker.name,
          type: sticker.type,
          albumOrder: sticker.albumOrder,
          sectionOrder: sticker.sectionOrder,
          quantity,
          owned: quantity > 0,
          duplicateCount: Math.max(quantity - 1, 0),
          tradeWeight: sticker.userStickers[0]?.tradeWeight ?? 1,
          section: sticker.section
            ? {
                id: sticker.section.id,
                name:
                  sticker.section.translations[0]?.name ??
                  sticker.section.code ??
                  '',
              }
            : null,
          player: sticker.player
            ? {
                id: sticker.player.id,
                name: sticker.player.name,
                displayName: sticker.player.displayName,
                image: sticker.player.images[0]
                  ? { url: sticker.player.images[0].url }
                  : null,
              }
            : null,
        };
      }),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  setQuantity(
    userId: string,
    userCollectionId: string,
    stickerId: string,
    quantity: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await this.assertMutationAccess(
        transaction,
        userId,
        userCollectionId,
        stickerId,
      );
      if (quantity === 0) {
        await transaction.userSticker.deleteMany({
          where: { userCollectionId, stickerId },
        });
        return { stickerId, quantity: 0, owned: false, duplicateCount: 0 };
      }
      const now = new Date();
      const record = await transaction.userSticker.upsert({
        where: { userCollectionId_stickerId: { userCollectionId, stickerId } },
        create: {
          userCollectionId,
          stickerId,
          quantity,
          firstAcquiredAt: now,
          lastAcquiredAt: now,
        },
        update: { quantity, lastAcquiredAt: now },
      });
      return this.quantityResponse(record.stickerId, record.quantity);
    });
  }

  increment(
    userId: string,
    userCollectionId: string,
    stickerId: string,
    amount: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await this.assertMutationAccess(
        transaction,
        userId,
        userCollectionId,
        stickerId,
      );
      const now = new Date();
      const record = await transaction.userSticker.upsert({
        where: {
          userCollectionId_stickerId: { userCollectionId, stickerId },
        },
        create: {
          userCollectionId,
          stickerId,
          quantity: amount,
          firstAcquiredAt: now,
          lastAcquiredAt: now,
        },
        update: {
          quantity: { increment: amount },
          lastAcquiredAt: now,
        },
      });
      return this.quantityResponse(record.stickerId, record.quantity);
    });
  }

  setTradeWeight(
    userId: string,
    userCollectionId: string,
    stickerId: string,
    tradeWeight: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await this.assertMutationAccess(
        transaction,
        userId,
        userCollectionId,
        stickerId,
      );
      const record = await transaction.userSticker.update({
        where: { userCollectionId_stickerId: { userCollectionId, stickerId } },
        data: { tradeWeight },
      });
      return { stickerId: record.stickerId, tradeWeight: record.tradeWeight };
    });
  }

  decrement(
    userId: string,
    userCollectionId: string,
    stickerId: string,
    amount: number,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        await this.assertMutationAccess(
          transaction,
          userId,
          userCollectionId,
          stickerId,
        );
        const record = await transaction.userSticker.findUnique({
          where: {
            userCollectionId_stickerId: { userCollectionId, stickerId },
          },
        });
        const currentQuantity = record?.quantity ?? 0;
        if (currentQuantity < amount) {
          throw new BadRequestException({
            code: 'QUANTITY_CANNOT_BE_NEGATIVE',
            message: 'Quantity cannot be negative',
          });
        }
        const nextQuantity = currentQuantity - amount;
        if (nextQuantity === 0) {
          await transaction.userSticker.deleteMany({
            where: { userCollectionId, stickerId },
          });
          return this.quantityResponse(stickerId, 0);
        }
        const updated = await transaction.userSticker.update({
          where: {
            userCollectionId_stickerId: { userCollectionId, stickerId },
          },
          data: {
            quantity: { decrement: amount },
            lastAcquiredAt: new Date(),
          },
        });
        return this.quantityResponse(updated.stickerId, updated.quantity);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  remove(userId: string, userCollectionId: string, stickerId: string) {
    return this.setQuantity(userId, userCollectionId, stickerId, 0);
  }

  async toggleVisibility(
    userId: string,
    userCollectionId: string,
    isPublic: boolean,
  ) {
    const updated = await this.prisma.userCollection.update({
      where: {
        id: userCollectionId,
        userId,
      },
      data: { isPublic },
      select: { isPublic: true },
    });
    return updated;
  }

  async export(userId: string, userCollectionId: string) {
    await this.requireOwnedCollection(userId, userCollectionId, 'en');
    const ownedStickers = await this.prisma.userSticker.findMany({
      where: { userCollectionId, quantity: { gt: 0 } },
      include: { sticker: { select: { code: true, albumOrder: true } } },
      orderBy: { sticker: { albumOrder: 'asc' } },
    });
    return { text: ownedStickers.map(s => `${s.quantity} ${s.sticker.code}`).join('\n') };
  }

  async bulkImport(userId: string, userCollectionId: string, textList: string) {
    const entry = await this.requireOwnedCollection(userId, userCollectionId, 'en');
    
    const lines = textList.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const updates: { quantity: number; normalizedCode: string }[] = [];
    
    for (const line of lines) {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const parsed = normalizeStickerCode(match[2]);
        if (parsed) {
          updates.push({
            quantity: parseInt(match[1], 10),
            normalizedCode: parsed,
          });
        }
      }
    }

    if (updates.length === 0) {
      return { imported: 0, totalLines: lines.length };
    }

    const stickers = await this.prisma.sticker.findMany({
      where: { 
        collectionId: entry.collectionId,
        normalizedCode: { in: updates.map(u => u.normalizedCode) }
      },
      select: { id: true, normalizedCode: true },
    });

    const codeToId = new Map(stickers.map(s => [s.normalizedCode, s.id]));
    
    let importedCount = 0;
    
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      for (const update of updates) {
        const stickerId = codeToId.get(update.normalizedCode);
        if (!stickerId) continue;
        
        importedCount++;
        
        if (update.quantity === 0) {
          await tx.userSticker.deleteMany({
            where: { userCollectionId, stickerId },
          });
        } else {
          await tx.userSticker.upsert({
            where: { userCollectionId_stickerId: { userCollectionId, stickerId } },
            create: {
              userCollectionId,
              stickerId,
              quantity: update.quantity,
              firstAcquiredAt: now,
              lastAcquiredAt: now,
            },
            update: {
              quantity: update.quantity,
              lastAcquiredAt: now,
            }
          });
        }
      }
    });

    return { imported: importedCount, totalLines: lines.length };
  }

  private async requireOwnedCollection(
    userId: string,
    userCollectionId: string,
    locale: Locale,
  ) {
    const entry = await this.prisma.userCollection.findUnique({
      where: { id: userCollectionId },
      include: {
        collection: {
          include: {
            translations: this.translationFilter(locale),
            sections: { select: { _count: { select: { stickers: true } } } },
          },
        },
      },
    });
    if (!entry) {
      throw new NotFoundException({
        code: 'USER_COLLECTION_NOT_FOUND',
        message: 'User collection not found',
      });
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_USER_COLLECTION',
        message: 'User collection belongs to another user',
      });
    }
    return entry;
  }

  private async assertMutationAccess(
    transaction: Prisma.TransactionClient,
    userId: string,
    userCollectionId: string,
    stickerId: string,
  ) {
    const userCollection = await transaction.userCollection.findUnique({
      where: { id: userCollectionId },
      select: { userId: true, collectionId: true },
    });
    if (!userCollection) {
      throw new NotFoundException({
        code: 'USER_COLLECTION_NOT_FOUND',
        message: 'User collection not found',
      });
    }
    if (userCollection.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_USER_COLLECTION',
        message: 'User collection belongs to another user',
      });
    }
    const stickerExists = await transaction.sticker.count({
      where: { id: stickerId, collectionId: userCollection.collectionId },
    });
    if (!stickerExists) {
      throw new BadRequestException({
        code: 'STICKER_NOT_IN_COLLECTION',
        message: 'Sticker does not belong to this collection',
      });
    }
  }

  private quantityFilter(status: PersonalStickerStatus) {
    if (status === PersonalStickerStatus.OWNED) {
      return { operator: 'some' as const, quantity: { gt: 0 } };
    }
    if (status === PersonalStickerStatus.DUPLICATES) {
      return { operator: 'some' as const, quantity: { gt: 1 } };
    }
    if (status === PersonalStickerStatus.MISSING) {
      return { operator: 'none' as const, quantity: { gt: 0 } };
    }
    return null;
  }

  private quantityResponse(stickerId: string, quantity: number) {
    return {
      stickerId,
      quantity,
      owned: quantity > 0,
      duplicateCount: Math.max(quantity - 1, 0),
    };
  }

  private translationFilter(locale: Locale) {
    const requested = localeToDatabase[locale];
    const fallbackLocales: SupportedLocale[] = [
      requested,
      SupportedLocale.PT_BR,
    ];
    return {
      where: { locale: { in: fallbackLocales } },
      orderBy: {
        locale:
          requested === SupportedLocale.PT_BR
            ? Prisma.SortOrder.asc
            : Prisma.SortOrder.desc,
      },
    };
  }
}
