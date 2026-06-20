import { StickerType } from '@sticker-track/database';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { LocaleQueryDto } from './locale-query.dto';

export enum StickerSort {
  ALBUM_ORDER = 'albumOrder',
  CODE = 'code',
  NAME = 'name',
}

export class ListStickersDto extends LocaleQueryDto {
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsEnum(StickerType)
  type?: StickerType;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsEnum(StickerSort)
  sort: StickerSort = StickerSort.ALBUM_ORDER;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit = 24;
}
