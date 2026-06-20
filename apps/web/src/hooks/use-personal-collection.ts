import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import {
  changeStickerQuantity,
  getUserCollection,
  getUserCollectionProgress,
  listPersonalStickers,
  type PersonalStickerPage,
  type QuantityResponse,
} from '../lib/personal-collections';
import type { Locale } from '../i18n/config';

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
    { stickerId: string; direction: 'increment' | 'decrement' },
    { snapshots: Array<[QueryKey, PersonalStickerPage | undefined]> }
  >({
    mutationFn: ({ stickerId, direction }) =>
      changeStickerQuantity(token, userCollectionId, stickerId, direction),
    onMutate: async ({ stickerId, direction }) => {
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
                entry.quantity + (direction === 'increment' ? 1 : -1),
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
