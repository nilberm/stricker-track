import { Type } from 'class-transformer';
import { ScanSource } from '@sticker-track/database';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ScanCandidateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  value!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(24, { each: true })
  corrections?: string[];
}

export class ResolveScanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  rawText!: string;

  @IsOptional()
  @IsEnum(ScanSource)
  source: ScanSource = ScanSource.MANUAL;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  ocrConfidence?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ScanCandidateDto)
  candidates?: ScanCandidateDto[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  selectedCandidate?: string;
}

export class ValidateScanCandidatesDto {
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ScanCandidateDto)
  candidates!: ScanCandidateDto[];
}

export class ConfirmScanDto {
  @IsUUID()
  scanId!: string;

  @IsUUID()
  stickerId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityToAdd = 1;
}
