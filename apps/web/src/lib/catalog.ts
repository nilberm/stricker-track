export type CollectionSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  releaseYear: number | null;
  publisherName: string | null;
  totalStickers: number;
  sectionCount: number;
  stickerCount: number;
  codeExample: string | null;
};

export type CollectionSection = {
  id: string;
  code: string | null;
  order: number;
  name: string;
  stickerCount: number;
};

export type StickerSummary = {
  id: string;
  collectionId: string;
  code: string;
  normalizedCode: string;
  name: string;
  type: string;
  order: number;
  section: CollectionSection | null;
  player: {
    id: string;
    name: string;
    displayName: string | null;
    countryCode: string | null;
    nationality: string | null;
    position: string | null;
    birthDate: string | null;
    image: {
      url: string;
      sourceUrl: string;
      author: string | null;
      license: string | null;
      licenseUrl: string | null;
    } | null;
  } | null;
};

export type StickerPage = {
  data: StickerSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
