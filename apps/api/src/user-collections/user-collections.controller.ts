import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocaleQueryDto } from '../collections/dto/locale-query.dto';
import {
  ChangeQuantityDto,
  ListUserStickersDto,
  SetQuantityDto,
} from './dto/user-collection.dto';
import { UserCollectionsService } from './user-collections.service';

@ApiTags('user collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UserCollectionsController {
  constructor(private readonly userCollections: UserCollectionsService) {}

  @Post('collections/:collectionId/start')
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
  ) {
    return this.userCollections.start(user.userId, collectionId);
  }

  @Get('user-collections')
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: LocaleQueryDto) {
    return this.userCollections.list(user.userId, query.locale);
  }

  @Get('user-collections/:userCollectionId')
  find(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Query() query: LocaleQueryDto,
  ) {
    return this.userCollections.find(
      user.userId,
      userCollectionId,
      query.locale,
    );
  }

  @Get('user-collections/:userCollectionId/progress')
  progress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Query() query: LocaleQueryDto,
  ) {
    return this.userCollections.progress(
      user.userId,
      userCollectionId,
      query.locale,
    );
  }

  @Get('user-collections/:userCollectionId/stickers')
  stickers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Query() query: ListUserStickersDto,
  ) {
    return this.userCollections.listStickers(
      user.userId,
      userCollectionId,
      query,
    );
  }

  @Put('user-collections/:userCollectionId/stickers/:stickerId')
  setQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Param('stickerId', ParseUUIDPipe) stickerId: string,
    @Body() input: SetQuantityDto,
  ) {
    return this.userCollections.setQuantity(
      user.userId,
      userCollectionId,
      stickerId,
      input.quantity,
    );
  }

  @Post('user-collections/:userCollectionId/stickers/:stickerId/increment')
  increment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Param('stickerId', ParseUUIDPipe) stickerId: string,
    @Body() input: ChangeQuantityDto,
  ) {
    return this.userCollections.increment(
      user.userId,
      userCollectionId,
      stickerId,
      input.amount,
    );
  }

  @Post('user-collections/:userCollectionId/stickers/:stickerId/decrement')
  decrement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Param('stickerId', ParseUUIDPipe) stickerId: string,
    @Body() input: ChangeQuantityDto,
  ) {
    return this.userCollections.decrement(
      user.userId,
      userCollectionId,
      stickerId,
      input.amount,
    );
  }

  @Delete('user-collections/:userCollectionId/stickers/:stickerId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userCollectionId', ParseUUIDPipe) userCollectionId: string,
    @Param('stickerId', ParseUUIDPipe) stickerId: string,
  ) {
    return this.userCollections.remove(
      user.userId,
      userCollectionId,
      stickerId,
    );
  }
}
