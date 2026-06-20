import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@sticker-track/database';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminPlayersService } from './admin-players.service';
import { CatalogImportService } from './catalog-import.service';
import {
  CreatePlayerImageDto,
  EnrichPlayerDto,
  ListAdminPlayersDto,
  SearchPlayerCandidatesDto,
  UpdateAdminPlayerDto,
  UpdatePlayerImageDto,
} from './dto/admin-player.dto';
import { CatalogImportInputDto } from './dto/catalog-import.dto';

@ApiTags('admin-phase-seven')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminPhaseSevenController {
  constructor(
    private readonly imports: CatalogImportService,
    private readonly players: AdminPlayersService,
  ) {}

  @Post('catalog-imports/validate')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  validateImport(@Body() input: CatalogImportInputDto) {
    return this.imports.validate(input);
  }

  @Post('catalog-imports/execute')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  executeImport(
    @Body() input: CatalogImportInputDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.imports.execute(input, user.userId);
  }

  @Get('catalog-imports/:importId')
  findImport(
    @Param('importId', ParseUUIDPipe) importId: string,
  ): Promise<unknown> {
    return this.imports.find(importId);
  }

  @Get('players')
  listPlayers(@Query() query: ListAdminPlayersDto) {
    return this.players.list(query);
  }

  @Get('players/:playerId')
  findPlayer(@Param('playerId', ParseUUIDPipe) playerId: string) {
    return this.players.find(playerId);
  }

  @Patch('players/:playerId')
  updatePlayer(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body() input: UpdateAdminPlayerDto,
  ): Promise<unknown> {
    return this.players.update(playerId, input);
  }

  @Get('players/:playerId/provider-candidates')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  candidates(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Query() input: SearchPlayerCandidatesDto,
  ) {
    return this.players.candidates(playerId, input);
  }

  @Post('players/:playerId/enrich')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  enrich(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body() input: EnrichPlayerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.players.enrich(playerId, input, user.userId);
  }

  @Post('players/:playerId/images')
  createImage(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body() input: CreatePlayerImageDto,
  ): Promise<unknown> {
    return this.players.createImage(playerId, input);
  }

  @Patch('player-images/:imageId')
  updateImage(
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() input: UpdatePlayerImageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.players.updateImage(imageId, input, user.userId);
  }

  @Delete('player-images/:imageId')
  deleteImage(
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<unknown> {
    return this.players.deleteImage(imageId);
  }
}
