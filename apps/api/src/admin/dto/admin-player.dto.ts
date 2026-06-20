import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EnrichmentProvider,
  EnrichmentStatus,
  ImageProvider,
  ImageReviewStatus,
} from '@sticker-track/database';
import { Type } from 'class-transformer';

export class ListAdminPlayersDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2,3}$/)
  countryCode?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWikidataId?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasImage?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  needsReview?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class UpdateAdminPlayerDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2,3}$/)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  countryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsEnum(EnrichmentStatus)
  enrichmentStatus?: EnrichmentStatus;
}

export class SearchPlayerCandidatesDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2,3}$/)
  countryCode?: string;
}

export class EnrichPlayerDto {
  @IsEnum(EnrichmentProvider)
  provider!: EnrichmentProvider;

  @IsString()
  @Matches(/^Q\d+$/)
  externalId!: string;
}

export class CreatePlayerImageDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2000)
  url!: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2000)
  sourceUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  license?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2000)
  licenseUrl?: string;

  @IsEnum(ImageProvider)
  provider!: ImageProvider;
}

export class UpdatePlayerImageDto {
  @IsOptional()
  @IsEnum(ImageReviewStatus)
  reviewStatus?: ImageReviewStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class PlayerIdDto {
  @IsUUID()
  playerId!: string;
}
