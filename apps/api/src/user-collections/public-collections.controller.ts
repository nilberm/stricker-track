import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocaleQueryDto } from '../collections/dto/locale-query.dto';
import { UserCollectionsService } from './user-collections.service';

@ApiTags('public collections')
@Controller('public-collections')
export class PublicCollectionsController {
  constructor(private readonly userCollections: UserCollectionsService) {}

  @Get()
  list(@Query() query: LocaleQueryDto) {
    return this.userCollections.listPublic(query.locale);
  }

  @Get(':userCollectionId')
  find(
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Query() query: LocaleQueryDto,
  ) {
    return this.userCollections.findPublic(userCollectionId, query.locale);
  }
}
