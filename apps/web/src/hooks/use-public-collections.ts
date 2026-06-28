import { useQuery } from '@tanstack/react-query';
import { listPublicCollections, getPublicCollection } from '../lib/personal-collections';
import type { Locale } from '../i18n/config';

export function usePublicCollections(locale: Locale) {
  return useQuery({
    queryKey: ['publicCollections', locale],
    queryFn: () => listPublicCollections(locale),
  });
}

export function usePublicCollectionDetail(
  userCollectionId: string,
  locale: Locale,
) {
  return useQuery({
    queryKey: ['publicCollection', userCollectionId, locale],
    queryFn: () => getPublicCollection(userCollectionId, locale),
    enabled: Boolean(userCollectionId),
  });
}
