import { useMutation, useQuery, useQueryClient, keepPreviousData, type QueryKey } from '@tanstack/react-query';
import {
  changeStickerQuantity,
  getUserCollection,
  getUserCollectionProgress,
  listPersonalStickers,
  type PersonalStickerPage,
  type QuantityResponse,
  toggleCollectionVisibility,
  listUserCollections,
  getCollectionMatch,
  setStickerTradeWeight,
} from '../lib/personal-collections';
import type { Locale } from '../i18n/config';

export function useUserCollections(
  locale: Locale,
  token: string | null,
) {
  return useQuery({
    queryKey: ['userCollections', locale],
    queryFn: () => listUserCollections(token!, locale),
    enabled: Boolean(token),
  });
}

export function usePersonalCollection(
  userCollectionId: string,
  locale: Locale,
  token: string | null,
) {
  return useQuery({
    queryKey: ['userCollection', userCollectionId, locale],
    queryFn: () => getUserCollection(token!, userCollectionId, locale),
    enabled: Boolean(token),
  });
}

export function usePersonalCollectionProgress(
  userCollectionId: string,
  locale: Locale,
  token: string | null,
) {
  return useQuery({
    queryKey: ['userCollectionProgress', userCollectionId, locale],
    queryFn: () => getUserCollectionProgress(token!, userCollectionId, locale),
    enabled: Boolean(token),
  });
}

export function usePersonalStickers(
  userCollectionId: string,
  token: string | null,
  queryString: string,
) {
  return useQuery({
    queryKey: ['userCollectionStickers', userCollectionId, queryString],
    queryFn: () => listPersonalStickers(token!, userCollectionId, new URLSearchParams(queryString)),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });
}

export function useStickerQuantityMutation(
  userCollectionId: string,
  token: string,
) {
  const queryClient = useQueryClient();

  return useMutation<
    QuantityResponse,
    Error,
    { stickerId: string; direction: 'increment' | 'decrement'; amount?: number },
    { snapshots: Array<[QueryKey, PersonalStickerPage | undefined]> }
  >({
    mutationFn: ({ stickerId, direction, amount = 1 }) =>
      changeStickerQuantity(token, userCollectionId, stickerId, direction, amount),
    onMutate: async ({ stickerId, direction, amount = 1 }) => {
      const queryKeyPrefix = ['userCollectionStickers', userCollectionId];
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix });
      
      const snapshots = queryClient.getQueriesData<PersonalStickerPage>({
        queryKey: queryKeyPrefix,
      });

      queryClient.setQueriesData<PersonalStickerPage>(
        { queryKey: queryKeyPrefix },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((entry) => {
              if (entry.id !== stickerId) return entry;
              const quantity = Math.max(
                0,
                entry.quantity + (direction === 'increment' ? amount : -amount),
              );
              return {
                ...entry,
                quantity,
                owned: quantity > 0,
                duplicateCount: Math.max(quantity - 1, 0),
              };
            }),
          };
        },
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, value]) =>
        queryClient.setQueryData(key, value),
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['userCollectionStickers', userCollectionId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['userCollectionProgress', userCollectionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['userCollections'] }),
      ]);
    },
  });
}

export function useStickerWeightMutation(
  userCollectionId: string,
  token: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stickerId, weight }: { stickerId: string; weight: number }) =>
      setStickerTradeWeight(token, userCollectionId, stickerId, weight),
    onMutate: async ({ stickerId, weight }) => {
      const queryKeyPrefix = ['userCollectionStickers', userCollectionId];
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix });
      
      const snapshots = queryClient.getQueriesData<PersonalStickerPage>({
        queryKey: queryKeyPrefix,
      });

      queryClient.setQueriesData<PersonalStickerPage>(
        { queryKey: queryKeyPrefix },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((entry) => {
              if (entry.id !== stickerId) return entry;
              return { ...entry, tradeWeight: weight };
            }),
          };
        },
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, value]) =>
        queryClient.setQueryData(key, value),
      );
    },
  });
}

export function useToggleCollectionVisibility(
  userCollectionId: string,
  token: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isPublic: boolean) =>
      toggleCollectionVisibility(token!, userCollectionId, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCollection', userCollectionId] });
      queryClient.invalidateQueries({ queryKey: ['userCollections'] });
    },
  });
}

export function useCollectionMatch(
  userCollectionId: string | null,
  targetUserCollectionId: string,
  locale: Locale,
  token: string | null,
) {
  return useQuery({
    queryKey: ['collectionMatch', userCollectionId, targetUserCollectionId, locale],
    queryFn: () => getCollectionMatch(token!, userCollectionId!, targetUserCollectionId, locale),
    enabled: Boolean(token) && Boolean(userCollectionId),
  });
}
