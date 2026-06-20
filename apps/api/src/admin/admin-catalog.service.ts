import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizeStickerCode } from '@sticker-track/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssociatePlayerDto,
  CreateCollectionDto,
  CreateSectionDto,
  CreateStickerDto,
  UpdateCollectionDto,
  UpdateSectionDto,
  UpdateStickerDto,
} from './dto/admin-catalog.dto';

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  createCollection(input: CreateCollectionDto): Promise<unknown> {
    return this.prisma.collection.create({
      data: {
        slug: input.slug,
        releaseYear: input.releaseYear,
        publisherName: input.publisherName,
        totalStickers: input.totalStickers,
        status: input.status,
        codePattern: input.codePattern,
        codeExample: input.codeExample,
        translations: { create: input.translations },
      },
      include: { translations: true },
    });
  }

  updateCollection(id: string, input: UpdateCollectionDto): Promise<unknown> {
    const { translations, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const collection = await transaction.collection.update({
        where: { id },
        data,
      });
      if (translations) {
        for (const translation of translations) {
          await transaction.collectionTranslation.upsert({
            where: {
              collectionId_locale: {
                collectionId: id,
                locale: translation.locale,
              },
            },
            update: {
              name: translation.name,
              description: translation.description,
            },
            create: { collectionId: id, ...translation },
          });
        }
      }
      return collection;
    });
  }

  createSection(input: CreateSectionDto): Promise<unknown> {
    return this.prisma.collectionSection.create({
      data: {
        collectionId: input.collectionId,
        code: input.code,
        type: input.type,
        order: input.order,
        translations: {
          create: input.translations.map(({ locale, name }) => ({
            locale,
            name,
          })),
        },
      },
      include: { translations: true },
    });
  }

  updateSection(id: string, input: UpdateSectionDto): Promise<unknown> {
    const { translations, ...data } = input;
    return this.prisma.$transaction(async (transaction) => {
      const section = await transaction.collectionSection.update({
        where: { id },
        data,
      });
      if (translations) {
        for (const translation of translations) {
          await transaction.collectionSectionTranslation.upsert({
            where: {
              sectionId_locale: { sectionId: id, locale: translation.locale },
            },
            update: { name: translation.name },
            create: {
              sectionId: id,
              locale: translation.locale,
              name: translation.name,
            },
          });
        }
      }
      return section;
    });
  }

  createSticker(input: CreateStickerDto): Promise<unknown> {
    const normalizedCode = this.requireNormalizedCode(input.code);
    return this.prisma.sticker.create({
      data: {
        ...input,
        normalizedCode,
        ...this.codeParts(normalizedCode),
      },
    });
  }

  updateSticker(id: string, input: UpdateStickerDto): Promise<unknown> {
    const codeData = input.code
      ? (() => {
          const normalizedCode = this.requireNormalizedCode(input.code);
          return { normalizedCode, ...this.codeParts(normalizedCode) };
        })()
      : {};
    return this.prisma.sticker.update({
      where: { id },
      data: { ...input, ...codeData },
    });
  }

  associatePlayer(
    stickerId: string,
    input: AssociatePlayerDto,
  ): Promise<unknown> {
    if (!input.playerId && !input.name) {
      throw new BadRequestException({
        code: 'PLAYER_INPUT_REQUIRED',
        message: 'playerId or name is required',
      });
    }

    return this.prisma.$transaction(async (transaction) => {
      const playerId =
        input.playerId ??
        (
          await transaction.player.create({
            data: {
              name: input.name!,
              displayName: input.displayName,
              countryCode: input.countryCode,
              position: input.position,
            },
          })
        ).id;
      return transaction.sticker.update({
        where: { id: stickerId },
        data: { playerId },
        include: { player: true },
      });
    });
  }

  private requireNormalizedCode(code: string) {
    const normalized = normalizeStickerCode(code);
    if (!normalized) {
      throw new BadRequestException({
        code: 'INVALID_STICKER_CODE',
        message: 'Sticker code is invalid',
      });
    }
    return normalized;
  }

  private codeParts(normalizedCode: string): {
    prefix: string;
    number: number;
  } {
    const match = normalizedCode.match(/^([A-Z]+)(\d+)$/)!;
    return {
      prefix: match[1],
      number: Number(match[2]),
    };
  }
}
