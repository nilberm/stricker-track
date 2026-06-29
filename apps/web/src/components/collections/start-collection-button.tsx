'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../i18n/navigation';
import { accessTokenKey } from '../../lib/auth';
import { startUserCollection } from '../../lib/personal-collections';

export function StartCollectionButton({
  collectionId,
}: {
  collectionId: string;
}) {
  const t = useTranslations('myCollections');
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const token = window.localStorage.getItem(accessTokenKey);
      if (!token) throw new Error('UNAUTHORIZED');
      return startUserCollection(token, collectionId);
    },
    onSuccess: async (entry) => {
      await queryClient.invalidateQueries({ queryKey: ['userCollections'] });
      router.push(`/my-collections/${entry.id}`);
    },
  });

  return (
    <button
      className="block w-full bg-emerald-400 px-5 py-3 text-center font-black uppercase tracking-wider text-zinc-900 transition-colors hover:bg-emerald-300 disabled:bg-zinc-300 disabled:text-zinc-500"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      type="button"
    >
      {mutation.isPending ? t('starting') : t('start')}
    </button>
  );
}
