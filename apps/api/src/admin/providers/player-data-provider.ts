export type ExternalPlayerImage = {
  url: string;
  sourceUrl: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
};

export type PlayerCandidate = {
  externalId: string;
  name: string;
  description?: string;
  country?: string;
  birthDate?: string;
  position?: string;
  image?: ExternalPlayerImage;
};

export type ExternalPlayerDetails = PlayerCandidate & {
  nationality?: string;
};

export interface PlayerDataProvider {
  searchPlayer(input: {
    name: string;
    countryCode?: string;
  }): Promise<PlayerCandidate[]>;

  getPlayerByExternalId(externalId: string): Promise<ExternalPlayerDetails>;
}

export const PLAYER_DATA_PROVIDER = Symbol('PLAYER_DATA_PROVIDER');
