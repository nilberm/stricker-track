import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollectionsService } from './collections.service';
import { ListStickersDto } from './dto/list-stickers.dto';
import { LocaleQueryDto } from './dto/locale-query.dto';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  list(@Query() query: LocaleQueryDto) {
    return this.collections.listPublished(query.locale);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @Query() query: LocaleQueryDto) {
    return this.collections.findPublishedBySlug(slug, query.locale);
  }

  @Get(':collectionId/sections')
  sections(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Query() query: LocaleQueryDto,
  ) {
    return this.collections.listSections(collectionId, query.locale);
  }

  @Get(':collectionId/stickers/code/:code')
  byCode(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Param('code') code: string,
    @Query() query: LocaleQueryDto,
  ) {
    return this.collections.findStickerByCode(collectionId, code, query.locale);
  }

  @Get(':collectionId/stickers/:stickerId')
  sticker(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Param('stickerId', ParseUUIDPipe) stickerId: string,
    @Query() query: LocaleQueryDto,
  ) {
    return this.collections.findSticker(collectionId, stickerId, query.locale);
  }

  @Get(':collectionId/stickers')
  stickers(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Query() query: ListStickersDto,
  ) {
    return this.collections.listStickers(collectionId, query, query.locale);
  }
}
