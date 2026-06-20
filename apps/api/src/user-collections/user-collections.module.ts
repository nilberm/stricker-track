import { Module } from '@nestjs/common';
import { UserCollectionsController } from './user-collections.controller';
import { UserCollectionsService } from './user-collections.service';

@Module({
  controllers: [UserCollectionsController],
  providers: [UserCollectionsService],
})
export class UserCollectionsModule {}
