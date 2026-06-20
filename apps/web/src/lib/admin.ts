import { authenticatedApiRequest } from './api';

export type CatalogImportReport = {
  fileName: string;
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  created: { sections: number; players: number; stickers: number };
  updated: { players: number; stickers: number };
  ignored: number;
  errors: Array<{ row?: number; code: string; message: string }>;
};

export type AdminPlayer = {
  id: string;
  name: string;
  displayName: string | null;
  countryCode: string | null;
  countryName: string | null;
  nationality: string | null;
  position: string | null;
  birthDate: string | null;
  wikidataId: string | null;
  enrichmentStatus: string;
  enrichmentError: string | null;
  images: AdminPlayerImage[];
  stickers?: Array<{ id: string; code: string; name: string; type: string }>;
  _count?: { stickers: number; images: number };
};

export type AdminPlayerImage = {
  id: string;
  url: string;
  sourceUrl: string;
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isPrimary: boolean;
};

export type PlayerCandidate = {
  externalId: string;
  name: string;
  description?: string;
  country?: string;
  birthDate?: string;
  position?: string;
  image?: {
    url: string;
    sourceUrl: string;
    author?: string;
    license?: string;
    licenseUrl?: string;
  };
};

export function validateCatalogImport(
  token: string,
  input: { fileName: string; csv: string; dryRun?: boolean },
) {
  return authenticatedApiRequest<CatalogImportReport>(
    '/admin/catalog-imports/validate',
    token,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function executeCatalogImport(
  token: string,
  input: { fileName: string; csv: string; dryRun?: boolean },
) {
  return authenticatedApiRequest<{
    importId: string | null;
    report: CatalogImportReport;
  }>('/admin/catalog-imports/execute', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listAdminPlayers(token: string, query: URLSearchParams) {
  return authenticatedApiRequest<{
    data: AdminPlayer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/admin/players?${query}`, token);
}

export function getAdminPlayer(token: string, playerId: string) {
  return authenticatedApiRequest<AdminPlayer>(
    `/admin/players/${playerId}`,
    token,
  );
}

export function searchPlayerCandidates(
  token: string,
  playerId: string,
  query: URLSearchParams,
) {
  return authenticatedApiRequest<PlayerCandidate[]>(
    `/admin/players/${playerId}/provider-candidates?${query}`,
    token,
  );
}

export function enrichAdminPlayer(
  token: string,
  playerId: string,
  externalId: string,
) {
  return authenticatedApiRequest<AdminPlayer>(
    `/admin/players/${playerId}/enrich`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ provider: 'WIKIDATA', externalId }),
    },
  );
}

export function updateAdminImage(
  token: string,
  imageId: string,
  input: {
    reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    isPrimary?: boolean;
  },
) {
  return authenticatedApiRequest<AdminPlayerImage>(
    `/admin/player-images/${imageId}`,
    token,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

export function deleteAdminImage(token: string, imageId: string) {
  return authenticatedApiRequest<unknown>(
    `/admin/player-images/${imageId}`,
    token,
    { method: 'DELETE' },
  );
}
