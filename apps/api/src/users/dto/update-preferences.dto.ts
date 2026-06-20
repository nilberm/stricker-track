import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiProperty({ enum: ['pt-BR', 'en', 'es'] })
  @IsIn(['pt-BR', 'en', 'es'])
  preferredLocale!: 'pt-BR' | 'en' | 'es';
}
