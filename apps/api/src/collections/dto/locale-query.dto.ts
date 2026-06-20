import { IsIn, IsOptional } from 'class-validator';

export class LocaleQueryDto {
  @IsOptional()
  @IsIn(['pt-BR', 'en', 'es'])
  locale: 'pt-BR' | 'en' | 'es' = 'pt-BR';
}
