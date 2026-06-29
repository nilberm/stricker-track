'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/config';
import { Link, useRouter } from '../../i18n/navigation';
import { accessTokenKey } from '../../lib/auth';
import { listUserCollections } from '../../lib/personal-collections';

export function MyCollectionsClient() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const token =
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(accessTokenKey);
  const query = useQuery({
    queryKey: ['userCollections', locale],
    queryFn: () => listUserCollections(token!, locale),
    enabled: Boolean(token),
  });

  if (!token && typeof window !== 'undefined') {
    router.replace('/login');
    return null;
  }
  if (query.isLoading) return <StateMessage message={t('common.loading')} />;
  if (query.isError)
    return <StateMessage message={t('myCollections.loadError')} />;
  if (!query.data?.length)
    return <StateMessage message={t('myCollections.empty')} />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {query.data.map((entry) => (
        <article
          className="relative overflow-hidden border-4 border-zinc-900 bg-white p-6 shadow-[8px_8px_0px_#18181b]"
          key={entry.id}
        >
          <div className="relative z-10">
            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">
              {entry.collection.releaseYear ?? t('common.notAvailable')}
            </p>
            <h2 className="mt-1 text-3xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{entry.collection.name}</h2>
          </div>

          <div className="relative z-10 mt-6">
            <ProgressBar percentage={entry.progress.completionPercentage} />
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
              <Metric
                label={t('myCollections.owned')}
                value={entry.progress.ownedUnique}
              />
              <Metric
                label={t('myCollections.missing')}
                value={entry.progress.missing}
              />
              <Metric
                label={t('myCollections.duplicates')}
                value={entry.progress.duplicates}
              />
            </div>
            <Link
              className="mt-6 block w-full border-2 border-zinc-900 bg-amber-400 px-4 py-4 text-center font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b] hover:bg-amber-300"
              href={`/my-collections/${entry.id}`}
            >
              {t('myCollections.open')}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-zinc-900 bg-amber-100 p-3 flex flex-col items-center justify-center">
      <strong className="block text-2xl font-black text-zinc-900 leading-none">{value}</strong>
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 mt-1">{label}</span>
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  const t = useTranslations('myCollections');
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs font-black text-zinc-900 tracking-widest uppercase">
        <span>{t('progress')}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-4 w-full border-2 border-zinc-900 bg-zinc-200">
        <div
          className="h-full bg-amber-400 border-r-2 border-zinc-900"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StateMessage({ message }: { message: string }) {
  return (
    <div className="border-4 border-dashed border-zinc-900 bg-white p-12 text-center text-lg font-black uppercase tracking-widest text-zinc-500">
      {message}
    </div>
  );
}
