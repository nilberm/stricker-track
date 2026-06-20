import { Injectable } from '@nestjs/common';
import { EnrichmentProvider, Prisma } from '@sticker-track/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProviderCacheService {
  constructor(private readonly prisma: PrismaService) {}

  async get<T>(provider: EnrichmentProvider, cacheKey: string) {
    const cached = await this.prisma.providerCache.findUnique({
      where: { provider_cacheKey: { provider, cacheKey } },
    });
    if (!cached || cached.expiresAt <= new Date()) return null;
    return cached.payload as T;
  }

  async set(
    provider: EnrichmentProvider,
    cacheKey: string,
    payload: Prisma.InputJsonValue,
    ttlMilliseconds = 24 * 60 * 60 * 1000,
  ) {
    const now = new Date();
    return this.prisma.providerCache.upsert({
      where: { provider_cacheKey: { provider, cacheKey } },
      update: {
        payload,
        lastRequestedAt: now,
        expiresAt: new Date(now.getTime() + ttlMilliseconds),
      },
      create: {
        provider,
        cacheKey,
        payload,
        lastRequestedAt: now,
        expiresAt: new Date(now.getTime() + ttlMilliseconds),
      },
    });
  }

  async assertMinimumInterval(
    provider: EnrichmentProvider,
    cacheKey: string,
    milliseconds = 1_000,
  ) {
    const cached = await this.prisma.providerCache.findUnique({
      where: { provider_cacheKey: { provider, cacheKey } },
      select: { lastRequestedAt: true },
    });
    return (
      !cached || Date.now() - cached.lastRequestedAt.getTime() >= milliseconds
    );
  }
}
