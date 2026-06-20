import { Injectable } from '@nestjs/common';
import type {
  ExternalPlayerDetails,
  PlayerCandidate,
  PlayerDataProvider,
} from './player-data-provider';

@Injectable()
export class MockPlayerDataProvider implements PlayerDataProvider {
  constructor(
    private readonly candidates: PlayerCandidate[] = [],
    private readonly details: Record<string, ExternalPlayerDetails> = {},
  ) {}

  searchPlayer(): Promise<PlayerCandidate[]> {
    return Promise.resolve(this.candidates);
  }

  getPlayerByExternalId(externalId: string): Promise<ExternalPlayerDetails> {
    const details = this.details[externalId];
    return details
      ? Promise.resolve(details)
      : Promise.reject(new Error('PROVIDER_PLAYER_NOT_FOUND'));
  }
}
