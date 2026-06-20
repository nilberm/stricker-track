import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ImageReviewStatus,
  Prisma,
  SupportedLocale,
  type Collection,
  type CollectionSection,
  type Player,
  type PlayerImage,
  type Sticker,
  CollectionStatus,
} from '@sticker-track/database';
import {
  localeToDatabase,
  normalizeStickerCode,
  type Locale,
} from '@sticker-track/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ListStickersDto, StickerSort } from './dto/list-stickers.dto';

type LocalizedCollection = Collection & {
  translations: Array<{ name: string; description: string | null }>;
  sections?: Array<{ _count: { stickers: number } }>;
  _count?: { sections: number };
};

type LocalizedSection = CollectionSection & {
  translations: Array<{ name: string }>;
  _count?: { stickers: number };
};

type StickerWithRelations = Sticker & {
  section:
    | (CollectionSection & { translations: Array<{ name: string }> })
    | null;
  player:
    | (Player & {
        images: PlayerImage[];
      })
    | null;
};

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(locale: Locale) {
    const collections = await this.prisma.collection.findMany({
      where: { status: CollectionStatus.PUBLISHED },
      orderBy: [{ releaseYear: 'desc' }, { createdAt: 'asc' }],
      include: {
        translations: this.translationFilter(locale),
        sections: { select: { _count: { select: { stickers: true } } } },
        _count: { select: { sections: true } },
      },
    });

    return (collections as unknown as LocalizedCollection[]).map((collection) =>
      this.mapCollection(collection),
    );
  }

  async findPublishedBySlug(slug: string, locale: Locale) {
    const collection = await this.prisma.collection.findFirst({
      where: { slug, status: CollectionStatus.PUBLISHED },
      include: {
        translations: this.translationFilter(locale),
        sections: { select: { _count: { select: { stickers: true } } } },
        _count: { select: { sections: true } },
      },
    });

    if (!collection) {
      throw new NotFoundException({
        code: 'COLLECTION_NOT_FOUND',
        message: 'Collection not found',
      });
    }

    return this.mapCollection(collection);
  }

  async listSections(collectionId: string, locale: Locale) {
    await this.assertPublishedCollection(collectionId);
    const sections = await this.prisma.collectionSection.findMany({
      where: { collectionId },
      orderBy: { order: 'asc' },
      include: {
        translations: this.translationFilter(locale),
        _count: { select: { stickers: true } },
      },
    });

    return (sections as unknown as LocalizedSection[]).map((section) =>
      this.mapSection(section),
    );
  }

  async listStickers(
    collectionId: string,
    query: ListStickersDto,
    locale: Locale,
  ) {
    await this.assertPublishedCollection(collectionId);
    const normalizedSearch = query.search
      ? normalizeStickerCode(query.search)
      : null;
    const where: Prisma.StickerWhereInput = {
      collectionId,
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
            include: { translations: this.translationFilter(locale) },
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
        },
      }),
      this.prisma.sticker.count({ where }),
    ]);

    return {
      data: (data as unknown as StickerWithRelations[]).map((sticker) =>
        this.mapSticker(sticker),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findSticker(collectionId: string, stickerId: string, locale: Locale) {
    await this.assertPublishedCollection(collectionId);
    const sticker = await this.prisma.sticker.findFirst({
      where: { id: stickerId, collectionId },
      include: {
        section: {
          include: { translations: this.translationFilter(locale) },
        },
        player: {
          include: {
            images: {
              where: { reviewStatus: ImageReviewStatus.APPROVED },
              orderBy: { isPrimary: 'desc' },
            },
          },
        },
      },
    });

    if (!sticker) this.throwStickerNotFound();
    return this.mapSticker(sticker);
  }

  async findStickerByCode(collectionId: string, code: string, locale: Locale) {
    await this.assertPublishedCollection(collectionId);
    const normalizedCode = normalizeStickerCode(code);
    if (!normalizedCode) this.throwStickerNotFound();

    const sticker = await this.prisma.sticker.findUnique({
      where: {
        collectionId_normalizedCode: { collectionId, normalizedCode },
      },
      include: {
        section: {
          include: { translations: this.translationFilter(locale) },
        },
        player: {
          include: {
            images: {
              where: { reviewStatus: ImageReviewStatus.APPROVED },
              orderBy: { isPrimary: 'desc' },
            },
          },
        },
      },
    });

    if (!sticker) this.throwStickerNotFound();
    return this.mapSticker(sticker);
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

  private async assertPublishedCollection(id: string) {
    const exists = await this.prisma.collection.count({
      where: { id, status: CollectionStatus.PUBLISHED },
    });
    if (!exists) {
      throw new NotFoundException({
        code: 'COLLECTION_NOT_FOUND',
        message: 'Collection not found',
      });
    }
  }

  private mapCollection(collection: LocalizedCollection) {
    const translation = collection.translations[0];
    return {
      id: collection.id,
      slug: collection.slug,
      name: translation?.name ?? collection.slug,
      description: translation?.description ?? null,
      releaseYear: collection.releaseYear,
      publisherName: collection.publisherName,
      totalStickers:
        collection.sections?.reduce((sum, s) => sum + s._count.stickers, 0) ??
        0,
      sectionCount: collection._count?.sections ?? 0,
      stickerCount:
        collection.sections?.reduce((sum, s) => sum + s._count.stickers, 0) ??
        0,
      codeExample: collection.codeExample,
    };
  }

  private mapSection(section: LocalizedSection) {
    return {
      id: section.id,
      code: section.code,
      order: section.order,
      name: section.translations[0]?.name ?? section.code ?? '',
      stickerCount: section._count?.stickers ?? 0,
    };
  }

  private mapSticker(sticker: StickerWithRelations) {
    const primaryImage =
      sticker.player?.images.find((image) => image.isPrimary) ??
      sticker.player?.images[0] ??
      null;
    return {
      id: sticker.id,
      collectionId: sticker.collectionId,
      code: sticker.code,
      normalizedCode: sticker.normalizedCode,
      name: sticker.name,
      type: sticker.type,
      albumOrder: sticker.albumOrder,
      sectionOrder: sticker.sectionOrder,
      section: sticker.section ? this.mapSection(sticker.section) : null,
      player: sticker.player
        ? {
            id: sticker.player.id,
            name: sticker.player.name,
            displayName: sticker.player.displayName,
            countryCode: sticker.player.countryCode,
            nationality: sticker.player.nationality,
            position: sticker.player.position,
            birthDate: sticker.player.birthDate,
            image: primaryImage
              ? {
                  url: primaryImage.url,
                  sourceUrl: primaryImage.sourceUrl,
                  author: primaryImage.author,
                  license: primaryImage.license,
                  licenseUrl: primaryImage.licenseUrl,
                }
              : null,
          }
        : null,
    };
  }

  private throwStickerNotFound(): never {
    throw new NotFoundException({
      code: 'STICKER_NOT_FOUND',
      message: 'Sticker not found',
    });
  }
}
