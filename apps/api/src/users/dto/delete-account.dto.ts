import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  currentPassword!: string;

  @ApiProperty({ enum: ['DELETE'] })
  @IsString()
  @IsIn(['DELETE'])
  confirmation!: 'DELETE';
}
