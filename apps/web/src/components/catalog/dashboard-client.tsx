'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/config';
import { Link, useRouter } from '../../i18n/navigation';
import { authenticatedApiRequest } from '../../lib/api';
import { accessTokenKey } from '../../lib/auth';
import type { CollectionSummary } from '../../lib/catalog';
import { StartCollectionButton } from '../collections/start-collection-button';

export function DashboardClient() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) {
      router.replace('/login');
      return;
    }
    void authenticatedApiRequest<CollectionSummary[]>(
      `/collections?locale=${encodeURIComponent(locale)}`,
      token,
    )
      .then((data) => {
        setCollections(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [locale, router]);

  if (status === 'loading') {
    return <CatalogMessage message={t('common.loading')} />;
  }
  if (status === 'error') {
    return <CatalogMessage message={t('catalog.loadError')} />;
  }
  if (collections.length === 0) {
    return <CatalogMessage message={t('dashboard.empty')} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {collections.map((collection) => (
        <article
          className="relative overflow-hidden flex flex-col rounded-3xl border border-amber-700/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 p-6 shadow-inner"
          key={collection.id}
        >
          {/* Card Header Layer with deep red accent */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-red-950/40 to-transparent pointer-events-none" />

          <div className="relative z-10 mb-5 flex h-28 items-center justify-center rounded-2xl border border-amber-700/50 bg-gradient-to-br from-zinc-900/80 via-zinc-800/80 to-zinc-950 text-4xl font-black text-amber-500 shadow-inner">
            {collection.name
              .split(/\s+/)
              .slice(0, 2)
              .map((word) => word[0])
              .join('')}
          </div>
          <h2 className="relative z-10 text-2xl font-black text-slate-100 drop-shadow-md">{collection.name}</h2>
          <p className="relative z-10 mt-2 flex-1 leading-6 text-amber-100/70">
            {collection.description}
          </p>
          <dl className="relative z-10 my-5 flex gap-5 text-sm text-amber-100/70">
            <div>
              <dt className="uppercase tracking-widest">{t('collection.year')}</dt>
              <dd className="font-bold text-slate-100 drop-shadow-md">
                {collection.releaseYear ?? t('common.notAvailable')}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-widest">{t('collection.totalStickers')}</dt>
              <dd className="font-bold text-slate-100 drop-shadow-md">
                {collection.totalStickers}
              </dd>
            </div>
          </dl>
          <div className="relative z-10 mt-4 flex justify-center">
            <StartCollectionButton collectionId={collection.id} />
          </div>
        </article>
      ))}
    </div>
  );
}

function CatalogMessage({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-amber-700/30 bg-zinc-900/50 p-10 text-center text-amber-100/70 shadow-inner">
      {message}
    </div>
  );
}
