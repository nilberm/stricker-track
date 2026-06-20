import { Module } from '@nestjs/common';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { RolesGuard } from '../auth/roles.guard';
import { AdminPhaseSevenController } from './admin-phase-seven.controller';
import { AdminPlayersService } from './admin-players.service';
import { CatalogImportService } from './catalog-import.service';
import { ProviderCacheService } from './provider-cache.service';
import { PLAYER_DATA_PROVIDER } from './providers/player-data-provider';
import { WikidataPlayerProvider } from './providers/wikidata-player.provider';

@Module({
  controllers: [AdminCatalogController, AdminPhaseSevenController],
  providers: [
    AdminCatalogService,
    AdminPlayersService,
    CatalogImportService,
    ProviderCacheService,
    RolesGuard,
    WikidataPlayerProvider,
    {
      provide: PLAYER_DATA_PROVIDER,
      useExisting: WikidataPlayerProvider,
    },
  ],
})
export class AdminModule {}
