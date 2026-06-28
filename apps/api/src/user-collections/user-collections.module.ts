import { Module } from '@nestjs/common';
import { UserCollectionsController } from './user-collections.controller';
import { PublicCollectionsController } from './public-collections.controller';
import { UserCollectionsService } from './user-collections.service';

@Module({
  controllers: [UserCollectionsController, PublicCollectionsController],
  providers: [UserCollectionsService],
})
export class UserCollectionsModule {}
