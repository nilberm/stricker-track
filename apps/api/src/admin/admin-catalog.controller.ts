import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@sticker-track/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminCatalogService } from './admin-catalog.service';
import {
  AssociatePlayerDto,
  CreateCollectionDto,
  CreateSectionDto,
  CreateStickerDto,
  UpdateCollectionDto,
  UpdateSectionDto,
  UpdateStickerDto,
} from './dto/admin-catalog.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Post('collections')
  createCollection(@Body() input: CreateCollectionDto) {
    return this.catalog.createCollection(input);
  }

  @Patch('collections/:id')
  updateCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateCollectionDto,
  ) {
    return this.catalog.updateCollection(id, input);
  }

  @Post('sections')
  createSection(@Body() input: CreateSectionDto) {
    return this.catalog.createSection(input);
  }

  @Patch('sections/:id')
  updateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateSectionDto,
  ) {
    return this.catalog.updateSection(id, input);
  }

  @Post('stickers')
  createSticker(@Body() input: CreateStickerDto) {
    return this.catalog.createSticker(input);
  }

  @Patch('stickers/:id')
  updateSticker(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateStickerDto,
  ) {
    return this.catalog.updateSticker(id, input);
  }

  @Patch('stickers/:id/player')
  associatePlayer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: AssociatePlayerDto,
  ) {
    return this.catalog.associatePlayer(id, input);
  }
}
