import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EnrichmentProvider,
  EnrichmentStatus,
  ImageProvider,
  ImageReviewStatus,
  Prisma,
} from '@sticker-track/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlayerImageDto,
  EnrichPlayerDto,
  ListAdminPlayersDto,
  SearchPlayerCandidatesDto,
  UpdateAdminPlayerDto,
  UpdatePlayerImageDto,
} from './dto/admin-player.dto';
import { normalizeName } from './catalog-import.service';
import {
  PLAYER_DATA_PROVIDER,
  type ExternalPlayerDetails,
  type PlayerCandidate,
  type PlayerDataProvider,
} from './providers/player-data-provider';
import { ProviderCacheService } from './provider-cache.service';

@Injectable()
export class AdminPlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: ProviderCacheService,
    @Inject(PLAYER_DATA_PROVIDER)
    private readonly provider: PlayerDataProvider,
  ) {}

  async list(query: ListAdminPlayersDto) {
    const where: Prisma.PlayerWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              {
                displayName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { wikidataId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.countryCode ? { countryCode: query.countryCode } : {}),
      ...(query.hasWikidataId === true ? { wikidataId: { not: null } } : {}),
      ...(query.hasWikidataId === false ? { wikidataId: null } : {}),
      ...(query.hasImage === true
        ? {
            images: {
              some: { reviewStatus: ImageReviewStatus.APPROVED },
            },
          }
        : {}),
      ...(query.hasImage === false
        ? {
            images: {
              none: { reviewStatus: ImageReviewStatus.APPROVED },
            },
          }
        : {}),
      ...(query.needsReview
        ? {
            enrichmentStatus: {
              in: [
                EnrichmentStatus.NOT_STARTED,
                EnrichmentStatus.CANDIDATES_FOUND,
                EnrichmentStatus.REVIEW_REQUIRED,
                EnrichmentStatus.FAILED,
              ],
            },
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.player.findMany({
        where,
        orderBy: [{ enrichmentStatus: 'asc' }, { name: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: { select: { stickers: true, images: true } },
          images: {
            where: { reviewStatus: ImageReviewStatus.APPROVED },
            orderBy: { isPrimary: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.player.count({ where }),
    ]);
    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async find(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] },
        stickers: {
          select: { id: true, code: true, name: true, type: true },
          orderBy: { albumOrder: 'asc' },
        },
      },
    });
    if (!player) this.notFound();
    return player;
  }

  update(playerId: string, input: UpdateAdminPlayerDto): Promise<unknown> {
    const data = {
      ...input,
      ...(input.name ? { normalizedName: normalizeName(input.name) } : {}),
    };
    return this.prisma.player.update({ where: { id: playerId }, data });
  }

  async candidates(
    playerId: string,
    input: SearchPlayerCandidatesDto,
  ): Promise<PlayerCandidate[]> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) this.notFound();
    const name = input.name?.trim() || player.name;
    const countryCode = input.countryCode ?? player.countryCode ?? undefined;
    const cacheKey = `search:${normalizeName(name)}:${countryCode ?? ''}`;
    const cached = await this.cache.get<PlayerCandidate[]>(
      EnrichmentProvider.WIKIDATA,
      cacheKey,
    );
    if (cached) return cached;
    if (
      !(await this.cache.assertMinimumInterval(
        EnrichmentProvider.WIKIDATA,
        cacheKey,
      ))
    ) {
      throw new HttpException(
        { code: 'PROVIDER_QUERY_TOO_FREQUENT' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    try {
      const candidates = await this.provider.searchPlayer({
        name,
        countryCode,
      });
      await this.cache.set(EnrichmentProvider.WIKIDATA, cacheKey, candidates);
      await this.prisma.player.update({
        where: { id: playerId },
        data: {
          enrichmentStatus: candidates.length
            ? EnrichmentStatus.CANDIDATES_FOUND
            : EnrichmentStatus.REVIEW_REQUIRED,
          lastProviderQueryAt: new Date(),
          enrichmentError: null,
        },
      });
      return candidates;
    } catch (error) {
      await this.prisma.player.update({
        where: { id: playerId },
        data: {
          enrichmentStatus: EnrichmentStatus.FAILED,
          enrichmentError:
            error instanceof Error
              ? error.message.slice(0, 500)
              : 'Provider request failed',
        },
      });
      throw error;
    }
  }

  async enrich(
    playerId: string,
    input: EnrichPlayerDto,
    administratorId: string,
  ) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) this.notFound();
    if (input.provider !== EnrichmentProvider.WIKIDATA) {
      throw new BadRequestException({ code: 'PROVIDER_NOT_SUPPORTED' });
    }
    const cacheKey = `details:${input.externalId}`;
    let details = await this.cache.get<ExternalPlayerDetails>(
      input.provider,
      cacheKey,
    );
    if (!details) {
      details = await this.provider.getPlayerByExternalId(input.externalId);
      await this.cache.set(input.provider, cacheKey, details);
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.player.update({
        where: { id: playerId },
        data: {
          name: safeText(details.name, 160),
          normalizedName: normalizeName(details.name),
          displayName: safeText(details.name, 160),
          nationality: safeOptionalText(details.nationality, 120),
          countryName: safeOptionalText(details.country, 120),
          position: safeOptionalText(details.position, 120),
          birthDate: details.birthDate
            ? new Date(`${details.birthDate}T00:00:00.000Z`)
            : null,
          wikidataId: input.externalId,
          enrichmentProvider: input.provider,
          enrichmentStatus: EnrichmentStatus.APPROVED,
          lastProviderQueryAt: new Date(),
          lastEnrichedAt: new Date(),
          enrichmentApprovedAt: new Date(),
          enrichmentApprovedBy: administratorId,
          enrichmentError: null,
        },
      });
      if (details.image) {
        await transaction.playerImage.upsert({
          where: {
            id:
              (
                await transaction.playerImage.findFirst({
                  where: {
                    playerId,
                    sourceUrl: details.image.sourceUrl,
                  },
                  select: { id: true },
                })
              )?.id ?? '00000000-0000-0000-0000-000000000000',
          },
          update: {
            url: details.image.url,
            author: details.image.author,
            license: details.image.license,
            licenseUrl: details.image.licenseUrl,
            fetchedAt: new Date(),
            reviewStatus: ImageReviewStatus.PENDING,
          },
          create: {
            playerId,
            url: details.image.url,
            sourceUrl: details.image.sourceUrl,
            author: details.image.author,
            license: details.image.license,
            licenseUrl: details.image.licenseUrl,
            provider: ImageProvider.WIKIMEDIA_COMMONS,
            reviewStatus: ImageReviewStatus.PENDING,
          },
        });
      }
      return updated;
    });
  }

  createImage(playerId: string, input: CreatePlayerImageDto): Promise<unknown> {
    this.assertSafeImageInput(input);
    return this.prisma.playerImage.create({
      data: {
        playerId,
        ...input,
        reviewStatus: ImageReviewStatus.PENDING,
      },
    });
  }

  async updateImage(
    imageId: string,
    input: UpdatePlayerImageDto,
    administratorId: string,
  ) {
    const image = await this.prisma.playerImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundException({ code: 'PLAYER_IMAGE_NOT_FOUND' });
    }
    if (
      input.reviewStatus === ImageReviewStatus.APPROVED &&
      (!image.sourceUrl || !image.license || !image.licenseUrl || !image.author)
    ) {
      throw new BadRequestException({
        code: 'IMAGE_ATTRIBUTION_INCOMPLETE',
      });
    }
    return this.prisma.$transaction(async (transaction) => {
      if (input.isPrimary) {
        await transaction.playerImage.updateMany({
          where: { playerId: image.playerId },
          data: { isPrimary: false },
        });
      }
      return transaction.playerImage.update({
        where: { id: imageId },
        data: {
          ...input,
          ...(input.reviewStatus
            ? {
                reviewedAt: new Date(),
                reviewedById: administratorId,
              }
            : {}),
          ...(input.reviewStatus &&
          input.reviewStatus !== ImageReviewStatus.APPROVED
            ? { isPrimary: false }
            : {}),
        },
      });
    });
  }

  deleteImage(imageId: string): Promise<unknown> {
    return this.prisma.playerImage.delete({ where: { id: imageId } });
  }

  private assertSafeImageInput(input: CreatePlayerImageDto) {
    const allowedHosts = new Set([
      'upload.wikimedia.org',
      'commons.wikimedia.org',
      'creativecommons.org',
    ]);
    for (const value of [input.url, input.sourceUrl, input.licenseUrl]) {
      if (!value) continue;
      const url = new URL(value);
      if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
        throw new BadRequestException({ code: 'INVALID_EXTERNAL_URL' });
      }
    }
    if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(new URL(input.url).pathname)) {
      throw new BadRequestException({ code: 'INVALID_IMAGE_TYPE' });
    }
  }

  private notFound(): never {
    throw new NotFoundException({
      code: 'PLAYER_NOT_FOUND',
      message: 'Player not found',
    });
  }
}

function safeText(value: string, maximum: number) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximum);
}

function safeOptionalText(value: string | undefined, maximum: number) {
  return value ? safeText(value, maximum) : null;
}
