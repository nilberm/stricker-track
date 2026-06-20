import { StickerType } from '@sticker-track/database';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { LocaleQueryDto } from '../../collections/dto/locale-query.dto';
import { StickerSort } from '../../collections/dto/list-stickers.dto';

export enum PersonalStickerStatus {
  ALL = 'all',
  OWNED = 'owned',
  MISSING = 'missing',
  DUPLICATES = 'duplicates',
}

export class ListUserStickersDto extends LocaleQueryDto {
  @IsOptional()
  @IsEnum(PersonalStickerStatus)
  status: PersonalStickerStatus = PersonalStickerStatus.ALL;

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

export class SetQuantityDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  quantity!: number;
}

export class ChangeQuantityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  amount = 1;
}

export class ProgressQueryDto extends LocaleQueryDto {
  @IsOptional()
  @IsIn(['summary'])
  view?: 'summary';
}
