import { authenticatedApiRequest } from './api';
import type { StickerCodeConfig } from '@sticker-track/shared';

export type CollectionProgress = {
  totalStickers: number;
  ownedUnique: number;
  missing: number;
  duplicates: number;
  totalQuantity: number;
  completionPercentage: number;
};

export type UserCollectionSummary = {
  id: string;
  startedAt: string;
  updatedAt: string;
  collection: {
    id: string;
    slug: string;
    name: string;
    totalStickers: number;
    releaseYear: number | null;
  };
  progress: CollectionProgress;
};

export type UserCollectionDetail = Omit<
  UserCollectionSummary,
  'progress' | 'collection'
> & {
  collection: UserCollectionSummary['collection'] & {
    description: string | null;
    codeConfig: StickerCodeConfig;
    knownCodePrefixes: string[];
  };
};

export type ProgressSection = {
  sectionId: string;
  code: string;
  type: string;
  countryIso2?: string;
  name: string;
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
  percentage: number;
};

export type UserCollectionProgress = CollectionProgress & {
  sections: ProgressSection[];
  recent: Array<{
    stickerId: string;
    code: string;
    name: string;
    quantity: number;
    updatedAt: string;
    section: string | null;
  }>;
};

export type PersonalSticker = {
  id: string;
  code: string;
  name: string;
  type: string;
  order: number;
  quantity: number;
  owned: boolean;
  duplicateCount: number;
  section: { id: string; name: string } | null;
  player: {
    id: string;
    name: string;
    displayName: string | null;
    image: { url: string } | null;
  } | null;
};

export type PersonalStickerPage = {
  data: PersonalSticker[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type QuantityResponse = {
  stickerId: string;
  quantity: number;
  owned: boolean;
  duplicateCount: number;
};

export type ScanSticker = {
  id: string;
  code: string;
  name: string;
  type: string;
  currentQuantity: number;
  quantityAfterConfirmation: number;
  section: { id: string; name: string } | null;
  player: {
    id: string;
    name: string;
    displayName: string | null;
    image: { url: string } | null;
  } | null;
};

export type ScanResolution = {
  scanId: string;
  rawText: string;
  normalizedCode: string | null;
  resultState:
    | 'STICKER_CODE_INVALID'
    | 'STICKER_CODE_NOT_FOUND'
    | 'SCAN_AMBIGUOUS_CODE'
    | 'MATCHED';
  candidates?: string[];
  candidateMatches?: Array<{
    id: string;
    code: string;
    normalizedCode: string;
    name: string;
  }>;
  matched: boolean;
  requiresConfirmation: boolean;
  errorCode?: string;
  sticker?: ScanSticker;
};

export type ScanCandidateInput = {
  value: string;
  confidence?: number;
  corrections?: string[];
};

export type ResolveScanInput = {
  rawText: string;
  source?: 'MANUAL' | 'CAMERA';
  candidates?: ScanCandidateInput[];
  selectedCandidate?: string;
  ocrConfidence?: number;
};

export type CameraOcrOutcome =
  | {
      status: 'OCR_NO_TEXT_DETECTED' | 'OCR_NO_CODE_CANDIDATE';
      rawText: string;
      candidates: ScanCandidateInput[];
      confidence?: number;
    }
  | {
      status: 'OCR_CANDIDATES_FOUND';
      rawText: string;
      candidates: ScanCandidateInput[];
      selectedCandidate?: string;
      confidence?: number;
    };

export type ScanConfirmationResult = {
  scanId: string;
  sticker: {
    id: string;
    code: string;
    previousQuantity: number;
    newQuantity: number;
    duplicateCount: number;
  };
  progress: {
    ownedUnique: number;
    missing: number;
    duplicates: number;
    percentage: number;
  };
};

export type ScanCandidateMatch = {
  id: string;
  code: string;
  normalizedCode: string;
  name: string;
};

export function listUserCollections(token: string, locale: string) {
  return authenticatedApiRequest<UserCollectionSummary[]>(
    `/user-collections?locale=${locale}`,
    token,
  );
}

export function getUserCollection(
  token: string,
  userCollectionId: string,
  locale: string,
) {
  return authenticatedApiRequest<UserCollectionDetail>(
    `/user-collections/${userCollectionId}?locale=${locale}`,
    token,
  );
}

export function getUserCollectionProgress(
  token: string,
  userCollectionId: string,
  locale: string,
) {
  return authenticatedApiRequest<UserCollectionProgress>(
    `/user-collections/${userCollectionId}/progress?locale=${locale}`,
    token,
  );
}

export function listPersonalStickers(
  token: string,
  userCollectionId: string,
  query: URLSearchParams,
) {
  return authenticatedApiRequest<PersonalStickerPage>(
    `/user-collections/${userCollectionId}/stickers?${query}`,
    token,
  );
}

export function startUserCollection(token: string, collectionId: string) {
  return authenticatedApiRequest<{ id: string }>(
    `/collections/${collectionId}/start`,
    token,
    { method: 'POST' },
  );
}

export function changeStickerQuantity(
  token: string,
  userCollectionId: string,
  stickerId: string,
  direction: 'increment' | 'decrement',
) {
  return authenticatedApiRequest<QuantityResponse>(
    `/user-collections/${userCollectionId}/stickers/${stickerId}/${direction}`,
    token,
    { method: 'POST', body: JSON.stringify({ amount: 1 }) },
  );
}

export function resolveScan(
  token: string,
  collectionId: string,
  locale: string,
  input: ResolveScanInput,
) {
  return authenticatedApiRequest<ScanResolution>(
    `/collections/${collectionId}/scans/resolve?locale=${locale}`,
    token,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function validateScanCandidates(
  token: string,
  collectionId: string,
  candidates: ScanCandidateInput[],
) {
  return authenticatedApiRequest<{ matches: ScanCandidateMatch[] }>(
    `/collections/${collectionId}/scans/candidates/validate`,
    token,
    { method: 'POST', body: JSON.stringify({ candidates }) },
  );
}

export function confirmManualScan(
  token: string,
  userCollectionId: string,
  scanId: string,
  stickerId: string,
) {
  return authenticatedApiRequest<ScanConfirmationResult>(
    `/user-collections/${userCollectionId}/scans/confirm`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ scanId, stickerId, quantityToAdd: 1 }),
    },
  );
}
