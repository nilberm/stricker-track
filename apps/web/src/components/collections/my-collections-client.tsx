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
          className="relative overflow-hidden rounded-3xl border border-amber-700/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 p-6 shadow-inner"
          key={entry.id}
        >
          {/* Card Header Layer with deep red accent */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-red-950/40 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-sm font-bold text-amber-100/70 uppercase tracking-widest">
              {entry.collection.releaseYear ?? t('common.notAvailable')}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-100 drop-shadow-md">{entry.collection.name}</h2>
          </div>

          <div className="relative z-10">
            <ProgressBar percentage={entry.progress.completionPercentage} />
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
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
              className="mt-6 block rounded-xl border-t border-amber-400/50 bg-gradient-to-b from-amber-600 to-amber-800 px-5 py-3 text-center font-bold tracking-wider uppercase text-amber-50 shadow-md shadow-black/50 transition hover:from-amber-500 hover:to-amber-700"
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
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-3 shadow-inner">
      <strong className="block text-xl text-slate-100 drop-shadow-md">{value}</strong>
      <span className="text-amber-100/70">{label}</span>
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  const t = useTranslations('myCollections');
  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-sm font-bold text-amber-100/70 tracking-widest uppercase">
        <span>{t('progress')}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StateMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-700/30 bg-zinc-900/50 p-12 text-center text-amber-100/70 shadow-inner">
      {message}
    </div>
  );
}
