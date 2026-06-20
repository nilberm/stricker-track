import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocaleQueryDto } from '../collections/dto/locale-query.dto';
import {
  ConfirmScanDto,
  ResolveScanDto,
  ValidateScanCandidatesDto,
} from './dto/scan.dto';
import { ScansService } from './scans.service';

@ApiTags('scans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ScansController {
  constructor(private readonly scans: ScansService) {}

  @Post('collections/:collectionId/scans/resolve')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Query() query: LocaleQueryDto,
    @Body() input: ResolveScanDto,
  ) {
    return this.scans.resolve(user.userId, collectionId, input, query.locale);
  }

  @Post('collections/:collectionId/scans/candidates/validate')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  validateCandidates(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() input: ValidateScanCandidatesDto,
  ) {
    return this.scans.validateCandidates(
      user.userId,
      collectionId,
      input.candidates,
    );
  }

  @Post('user-collections/:userCollectionId/scans/confirm')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Body() input: ConfirmScanDto,
  ) {
    return this.scans.confirm(
      user.userId,
      userCollectionId,
      input.scanId,
      input.stickerId,
      input.quantityToAdd,
    );
  }
}
