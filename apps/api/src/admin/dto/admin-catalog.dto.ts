import {
  StickerType,
  SupportedLocale,
  CollectionStatus,
  SectionType,
} from '@sticker-track/database';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class TranslationDto {
  @IsEnum(SupportedLocale)
  locale!: SupportedLocale;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCollectionDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsOptional()
  @IsInt()
  releaseYear?: number;

  @IsOptional()
  @IsString()
  publisherName?: string;

  @IsInt()
  @Min(0)
  totalStickers!: number;

  @IsOptional()
  @IsEnum(CollectionStatus)
  status?: CollectionStatus;

  @IsOptional()
  @IsString()
  codePattern?: string;

  @IsOptional()
  @IsString()
  codeExample?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations!: TranslationDto[];
}

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  publisherName?: string;

  @IsOptional()
  @IsInt()
  releaseYear?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalStickers?: number;

  @IsOptional()
  @IsEnum(CollectionStatus)
  status?: CollectionStatus;

  @IsOptional()
  @IsString()
  codePattern?: string;

  @IsOptional()
  @IsString()
  codeExample?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export class CreateSectionDto {
  @IsUUID()
  collectionId!: string;

  @IsString()
  code!: string;

  @IsEnum(SectionType)
  type!: SectionType;

  @IsInt()
  @Min(1)
  order!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations!: TranslationDto[];
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(SectionType)
  type?: SectionType;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export class CreateStickerDto {
  @IsUUID()
  collectionId!: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsEnum(StickerType)
  type!: StickerType;

  @IsInt()
  @Min(1)
  albumOrder!: number;

  @IsInt()
  @Min(1)
  sectionOrder!: number;
}

export class UpdateStickerDto {
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(StickerType)
  type?: StickerType;

  @IsOptional()
  @IsInt()
  @Min(1)
  albumOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sectionOrder?: number;
}

export class AssociatePlayerDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  position?: string;
}
