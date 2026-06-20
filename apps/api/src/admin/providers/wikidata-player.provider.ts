import {
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ExternalPlayerDetails,
  ExternalPlayerImage,
  PlayerCandidate,
  PlayerDataProvider,
} from './player-data-provider';

type EntityValue = {
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<
    string,
    Array<{
      mainsnak?: {
        datavalue?: { value?: unknown };
      };
    }>
  >;
};

@Injectable()
export class WikidataPlayerProvider implements PlayerDataProvider {
  private readonly wikidataApi = 'https://www.wikidata.org/w/api.php';
  private readonly commonsApi = 'https://commons.wikimedia.org/w/api.php';

  constructor(private readonly config?: ConfigService) {}

  async searchPlayer(input: {
    name: string;
    countryCode?: string;
  }): Promise<PlayerCandidate[]> {
    const query = new URLSearchParams({
      action: 'wbsearchentities',
      search: input.name,
      language: 'en',
      uselang: 'en',
      type: 'item',
      limit: '10',
      format: 'json',
      origin: '*',
    });
    const response = await this.requestJson<{
      search?: Array<{
        id: string;
        label?: string;
        description?: string;
      }>;
    }>(`${this.wikidataApi}?${query}`);

    return Promise.all(
      (response.search ?? []).slice(0, 10).map(async (item) => {
        const details = await this.getPlayerByExternalId(item.id);
        return {
          ...details,
          name: item.label ?? details.name,
          description: item.description ?? details.description,
        };
      }),
    );
  }

  async getPlayerByExternalId(
    externalId: string,
  ): Promise<ExternalPlayerDetails> {
    const entity = await this.getEntity(externalId);
    const countryId = claimEntityId(entity, 'P27');
    const positionId = claimEntityId(entity, 'P413');
    const relatedIds = [countryId, positionId].filter(
      (value): value is string => Boolean(value),
    );
    const related = relatedIds.length ? await this.getEntities(relatedIds) : {};
    const imageName = claimString(entity, 'P18');
    const image = imageName ? await this.getCommonsImage(imageName) : undefined;

    return {
      externalId,
      name: label(entity) ?? externalId,
      description: description(entity),
      country: countryId ? label(related[countryId]) : undefined,
      nationality: countryId ? label(related[countryId]) : undefined,
      position: positionId ? label(related[positionId]) : undefined,
      birthDate: claimDate(entity, 'P569'),
      image,
    };
  }

  private async getEntity(id: string) {
    const entities = await this.getEntities([id]);
    const entity = entities[id];
    if (!entity) throw new Error('PROVIDER_PLAYER_NOT_FOUND');
    return entity;
  }

  private async getEntities(ids: string[]) {
    const query = new URLSearchParams({
      action: 'wbgetentities',
      ids: ids.join('|'),
      props: 'labels|descriptions|claims',
      languages: 'en|pt|es',
      languagefallback: '1',
      format: 'json',
      origin: '*',
    });
    const response = await this.requestJson<{
      entities?: Record<string, EntityValue>;
    }>(`${this.wikidataApi}?${query}`);
    return response.entities ?? {};
  }

  private async getCommonsImage(
    fileName: string,
  ): Promise<ExternalPlayerImage | undefined> {
    const title = fileName.startsWith('File:') ? fileName : `File:${fileName}`;
    const query = new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      titles: title,
      iiprop: 'url|extmetadata',
      format: 'json',
      origin: '*',
    });
    const response = await this.requestJson<{
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            imageinfo?: Array<{
              url?: string;
              descriptionurl?: string;
              extmetadata?: Record<string, { value?: string }>;
            }>;
          }
        >;
      };
    }>(`${this.commonsApi}?${query}`);
    const page = Object.values(response.query?.pages ?? {})[0];
    const info = page?.imageinfo?.[0];
    if (!info?.url || !info.descriptionurl) return undefined;
    const metadata = info.extmetadata ?? {};
    return {
      url: info.url,
      sourceUrl: info.descriptionurl,
      author: plainText(metadata.Artist?.value),
      license: plainText(
        metadata.LicenseShortName?.value ?? metadata.UsageTerms?.value,
      ),
      licenseUrl: validHttpsUrl(metadata.LicenseUrl?.value),
    };
  }

  private async requestJson<T>(url: string, attempt = 0): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config?.get<number>('EXTERNAL_PROVIDER_TIMEOUT_MS') ?? 8_000,
    );
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent':
            this.config?.get<string>('WIKIDATA_USER_AGENT') ??
            'StickerTrack/0.1 (administrative enrichment)',
        },
      });
      if (
        response.status === 429 &&
        attempt <
          (this.config?.get<number>('EXTERNAL_PROVIDER_RETRY_LIMIT') ?? 1)
      ) {
        await delay(750);
        return this.requestJson<T>(url, attempt + 1);
      }
      if (!response.ok) {
        throw new ServiceUnavailableException({
          code:
            response.status === 429
              ? 'PROVIDER_RATE_LIMITED'
              : 'PROVIDER_UNAVAILABLE',
        });
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException({ code: 'PROVIDER_TIMEOUT' });
      }
      throw new ServiceUnavailableException({ code: 'PROVIDER_UNAVAILABLE' });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function claimValue(entity: EntityValue, property: string) {
  return entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
}

function claimEntityId(entity: EntityValue, property: string) {
  const value = claimValue(entity, property);
  if (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string'
  ) {
    return value.id;
  }
  return undefined;
}

function claimString(entity: EntityValue, property: string) {
  const value = claimValue(entity, property);
  return typeof value === 'string' ? value : undefined;
}

function claimDate(entity: EntityValue, property: string) {
  const value = claimValue(entity, property);
  if (
    typeof value === 'object' &&
    value !== null &&
    'time' in value &&
    typeof value.time === 'string'
  ) {
    return value.time.replace(/^\+/, '').slice(0, 10);
  }
  return undefined;
}

function label(entity?: EntityValue) {
  return (
    entity?.labels?.en?.value ??
    entity?.labels?.pt?.value ??
    entity?.labels?.es?.value
  );
}

function description(entity?: EntityValue) {
  return (
    entity?.descriptions?.en?.value ??
    entity?.descriptions?.pt?.value ??
    entity?.descriptions?.es?.value
  );
}

function plainText(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

function validHttpsUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
