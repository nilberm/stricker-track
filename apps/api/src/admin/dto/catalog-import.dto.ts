import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CatalogImportInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000_000)
  csv!: string;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
