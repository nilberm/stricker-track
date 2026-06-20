import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ImageReviewStatus,
  Prisma,
  ScanSource,
  ScanStatus,
  SupportedLocale,
  CollectionStatus,
} from '@sticker-track/database';
import {
  localeToDatabase,
  resolveStickerCode,
  type Locale,
} from '@sticker-track/shared';
import { PrismaService } from '../prisma/prisma.service';
import { calculateProgress } from '../user-collections/progress';
import type { ResolveScanDto } from './dto/scan.dto';
import type { ScanCandidateDto } from './dto/scan.dto';

@Injectable()
export class ScansService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    userId: string,
    collectionId: string,
    input: ResolveScanDto,
    locale: Locale,
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        status: true,
        codePattern: true,
        codeExample: true,
        codePrefixMinLength: true,
        codePrefixMaxLength: true,
        codeNumberMinLength: true,
        codeNumberMaxLength: true,
      },
    });
    if (!collection || collection.status !== CollectionStatus.PUBLISHED) {
      throw new NotFoundException({
        code: 'COLLECTION_NOT_FOUND',
        message: 'Collection not found',
      });
    }

    const userCollection = await this.prisma.userCollection.findUnique({
      where: { userId_collectionId: { userId, collectionId } },
      select: { id: true },
    });
    if (!userCollection) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_USER_COLLECTION',
        message: 'The user has not started this collection',
      });
    }

    const trimmedRawText = input.rawText.trim();
    const selectedInput = input.selectedCandidate?.trim();
    if (
      selectedInput &&
      !input.candidates?.some((candidate) => candidate.value === selectedInput)
    ) {
      throw new BadRequestException({
        code: 'INVALID_SCAN_CANDIDATE',
        message: 'Selected candidate was not submitted for this scan',
      });
    }
    const selectedMetadata = input.candidates?.find(
      (candidate) => candidate.value === selectedInput,
    );
    const resolutionInput = selectedInput ?? trimmedRawText;
    const codeConfig = {
      pattern: collection.codePattern,
      example: collection.codeExample,
      prefixMinLength: collection.codePrefixMinLength,
      prefixMaxLength: collection.codePrefixMaxLength,
      numberMinLength: collection.codeNumberMinLength,
      numberMaxLength: collection.codeNumberMaxLength,
    };
    const resolution = resolveStickerCode(resolutionInput, codeConfig);
    const submittedCandidates =
      !selectedInput && input.candidates
        ? [
            ...new Set(
              input.candidates.flatMap((candidate) => {
                const candidateResolution = resolveStickerCode(
                  candidate.value,
                  codeConfig,
                );
                return candidateResolution.normalizedCode
                  ? [candidateResolution.normalizedCode]
                  : candidateResolution.candidates;
              }),
            ),
          ]
        : [];
    if (
      !resolution.normalizedCode &&
      !resolution.candidates.length &&
      !submittedCandidates.length
    ) {
      const scan = await this.createScan({
        userId,
        collectionId,
        userCollectionId: userCollection.id,
        ...this.scanMetadata(input, trimmedRawText, selectedMetadata),
        rawText: trimmedRawText,
        status: ScanStatus.INVALID,
      });
      return {
        scanId: scan.id,
        rawText: trimmedRawText,
        normalizedCode: null,
        matched: false,
        requiresConfirmation: false,
        resultState: 'STICKER_CODE_INVALID',
        errorCode: 'STICKER_CODE_INVALID',
      };
    }

    const candidates = submittedCandidates.length
      ? submittedCandidates
      : resolution.normalizedCode
        ? [resolution.normalizedCode]
        : resolution.candidates;
    const stickers = await this.prisma.sticker.findMany({
      where: { collectionId, normalizedCode: { in: candidates } },
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
        userStickers: {
          where: { userCollectionId: userCollection.id },
          take: 1,
        },
      },
    });
    stickers.sort(
      (left, right) =>
        candidates.indexOf(left.normalizedCode) -
        candidates.indexOf(right.normalizedCode),
    );
    if (stickers.length !== 1) {
      const normalizedCode = resolution.normalizedCode ?? null;
      const scan = await this.createScan({
        userId,
        collectionId,
        userCollectionId: userCollection.id,
        ...this.scanMetadata(input, trimmedRawText, selectedMetadata),
        rawText: trimmedRawText,
        detectedCode: normalizedCode,
        normalizedCode,
        status:
          stickers.length > 1
            ? ScanStatus.CONFIRMATION_REQUIRED
            : ScanStatus.NOT_FOUND,
      });
      return {
        scanId: scan.id,
        rawText: trimmedRawText,
        normalizedCode,
        candidates,
        candidateMatches: stickers.map((sticker) => ({
          id: sticker.id,
          code: sticker.code,
          normalizedCode: sticker.normalizedCode,
          name: sticker.name,
        })),
        matched: false,
        requiresConfirmation: stickers.length > 1,
        resultState:
          stickers.length > 1
            ? 'SCAN_AMBIGUOUS_CODE'
            : 'STICKER_CODE_NOT_FOUND',
        errorCode:
          stickers.length > 1
            ? 'SCAN_AMBIGUOUS_CODE'
            : 'STICKER_CODE_NOT_FOUND',
      };
    }

    const sticker = stickers[0];
    const normalizedCode = sticker.normalizedCode;
    const scan = await this.createScan({
      userId,
      collectionId,
      userCollectionId: userCollection.id,
      ...this.scanMetadata(
        input,
        trimmedRawText,
        selectedMetadata ??
          input.candidates?.find(
            (candidate) => candidate.value === normalizedCode,
          ),
        normalizedCode,
      ),
      rawText: trimmedRawText,
      detectedCode: normalizedCode,
      normalizedCode,
      stickerId: sticker.id,
      status: ScanStatus.CONFIRMATION_REQUIRED,
    });
    const currentQuantity = sticker.userStickers[0]?.quantity ?? 0;
    return {
      scanId: scan.id,
      rawText: trimmedRawText,
      normalizedCode,
      matched: true,
      requiresConfirmation: true,
      resultState: 'MATCHED',
      sticker: {
        id: sticker.id,
        code: sticker.code,
        name: sticker.name,
        type: sticker.type,
        currentQuantity,
        quantityAfterConfirmation: currentQuantity + 1,
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
      },
    };
  }

  async validateCandidates(
    userId: string,
    collectionId: string,
    submitted: ScanCandidateDto[],
  ) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, status: CollectionStatus.PUBLISHED },
      select: {
        codePattern: true,
        codeExample: true,
        codePrefixMinLength: true,
        codePrefixMaxLength: true,
        codeNumberMinLength: true,
        codeNumberMaxLength: true,
      },
    });
    if (!collection) {
      throw new NotFoundException({
        code: 'COLLECTION_NOT_FOUND',
        message: 'Collection not found',
      });
    }
    const userCollection = await this.prisma.userCollection.findUnique({
      where: { userId_collectionId: { userId, collectionId } },
      select: { id: true },
    });
    if (!userCollection) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_USER_COLLECTION',
        message: 'The user has not started this collection',
      });
    }
    const config = {
      pattern: collection.codePattern,
      example: collection.codeExample,
      prefixMinLength: collection.codePrefixMinLength,
      prefixMaxLength: collection.codePrefixMaxLength,
      numberMinLength: collection.codeNumberMinLength,
      numberMaxLength: collection.codeNumberMaxLength,
    };
    const candidates = submitted
      .flatMap((candidate) => {
        const resolution = resolveStickerCode(candidate.value, config);
        return resolution.normalizedCode
          ? [resolution.normalizedCode]
          : resolution.candidates;
      })
      .filter((value, index, values) => values.indexOf(value) === index);
    const matches = await this.prisma.sticker.findMany({
      where: { collectionId, normalizedCode: { in: candidates } },
      select: { id: true, code: true, normalizedCode: true, name: true },
    });
    return { matches };
  }

  confirm(
    userId: string,
    userCollectionId: string,
    scanId: string,
    stickerId: string,
    quantityToAdd: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const userCollection = await transaction.userCollection.findUnique({
        where: { id: userCollectionId },
        include: { collection: { select: { totalStickers: true } } },
      });
      if (!userCollection) {
        throw new NotFoundException({
          code: 'USER_COLLECTION_NOT_FOUND',
          message: 'User collection not found',
        });
      }
      if (userCollection.userId !== userId) {
        throw new ForbiddenException({
          code: 'SCAN_DOES_NOT_BELONG_TO_USER',
          message: 'Scan does not belong to this user',
        });
      }

      const scan = await transaction.stickerScan.findUnique({
        where: { id: scanId },
      });
      if (!scan) {
        throw new NotFoundException({
          code: 'SCAN_NOT_FOUND',
          message: 'Scan not found',
        });
      }
      if (
        scan.userId !== userId ||
        scan.userCollectionId !== userCollectionId ||
        scan.collectionId !== userCollection.collectionId
      ) {
        throw new ForbiddenException({
          code: 'SCAN_DOES_NOT_BELONG_TO_USER',
          message: 'Scan does not belong to this user collection',
        });
      }
      if (scan.stickerId !== stickerId) {
        throw new BadRequestException({
          code: 'SCAN_STICKER_MISMATCH',
          message: 'Sticker does not match the resolved scan',
        });
      }

      const claim = await transaction.stickerScan.updateMany({
        where: {
          id: scanId,
          userId,
          userCollectionId,
          stickerId,
          status: ScanStatus.CONFIRMATION_REQUIRED,
        },
        data: { status: ScanStatus.CONFIRMED, confirmedAt: new Date() },
      });
      if (claim.count !== 1) {
        throw new BadRequestException({
          code: 'SCAN_ALREADY_CONFIRMED',
          message: 'Scan has already been confirmed',
        });
      }

      const existing = await transaction.userSticker.findUnique({
        where: {
          userCollectionId_stickerId: { userCollectionId, stickerId },
        },
        select: { quantity: true },
      });
      const previousQuantity = existing?.quantity ?? 0;
      const now = new Date();
      const record = await transaction.userSticker.upsert({
        where: {
          userCollectionId_stickerId: { userCollectionId, stickerId },
        },
        create: {
          userCollectionId,
          stickerId,
          quantity: quantityToAdd,
          firstAcquiredAt: now,
          lastAcquiredAt: now,
        },
        update: {
          quantity: { increment: quantityToAdd },
          lastAcquiredAt: now,
        },
        include: { sticker: { select: { code: true } } },
      });
      const quantities = await transaction.userSticker.findMany({
        where: { userCollectionId },
        select: { quantity: true },
      });
      const progress = calculateProgress(
        userCollection.collection.totalStickers,
        quantities,
      );

      return {
        scanId,
        sticker: {
          id: stickerId,
          code: record.sticker.code,
          previousQuantity,
          newQuantity: record.quantity,
          duplicateCount: Math.max(record.quantity - 1, 0),
        },
        progress: {
          ownedUnique: progress.ownedUnique,
          missing: progress.missing,
          duplicates: progress.duplicates,
          percentage: progress.completionPercentage,
        },
      };
    });
  }

  private createScan(data: Prisma.StickerScanUncheckedCreateInput) {
    return this.prisma.stickerScan.create({ data });
  }

  private scanMetadata(
    input: ResolveScanDto,
    rawText: string,
    selectedMetadata?: NonNullable<ResolveScanDto['candidates']>[number],
    resolvedCandidate?: string,
  ): Pick<
    Prisma.StickerScanUncheckedCreateInput,
    'source' | 'ocrRawText' | 'selectedCandidate' | 'corrections' | 'confidence'
  > {
    if (input.source !== ScanSource.CAMERA) {
      return {
        source: ScanSource.MANUAL,
        ocrRawText: null,
        selectedCandidate: null,
        corrections: [],
        confidence: null,
      };
    }

    return {
      source: ScanSource.CAMERA,
      ocrRawText: rawText,
      selectedCandidate:
        input.selectedCandidate?.trim() ?? resolvedCandidate ?? null,
      corrections: selectedMetadata?.corrections ?? [],
      confidence: selectedMetadata?.confidence ?? input.ocrConfidence ?? null,
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
