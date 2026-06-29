'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/config';
import { Link } from '../../i18n/navigation';
import { apiRequest } from '../../lib/api';
import type { CollectionSummary } from '../../lib/catalog';
import { StartCollectionButton } from '../../components/collections/start-collection-button';

function getCategoryColors(categoryId: string) {
  switch (categoryId) {
    case 'SPORTS':
      return { bg: 'bg-green-600', border: 'border-green-600', text: 'text-amber-300', badgeText: 'text-white' };
    case 'TCG_POKEMON':
      return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-yellow-300', badgeText: 'text-white' };
    case 'TCG_MAGIC':
      return { bg: 'bg-violet-600', border: 'border-violet-600', text: 'text-amber-400', badgeText: 'text-white' };
    case 'CUSTOM':
      return { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-white', badgeText: 'text-white' };
    default:
      return { bg: 'bg-zinc-800', border: 'border-zinc-800', text: 'text-white', badgeText: 'text-white' };
  }
}

export function HubClient() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    void apiRequest<CollectionSummary[]>(`/collections?locale=${encodeURIComponent(locale)}`)
      .then((data) => {
        setCollections(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [locale]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <header className="mb-12 border-b-4 border-zinc-900 pb-8">
        <h1 className="text-5xl font-black uppercase tracking-tight text-zinc-900 sm:text-7xl drop-shadow-[4px_4px_0px_#14b8a6]">
          {t('home.title')}
        </h1>
        <p className="mt-4 max-w-2xl text-xl font-bold text-zinc-600">
          {t('home.description')}
        </p>
      </header>

      {status === 'loading' && (
        <div className="border-4 border-zinc-900 bg-white p-12 text-center font-black uppercase text-xl shadow-[6px_6px_0px_#18181b]">
          {t('common.loading')}
        </div>
      )}
      
      {status === 'error' && (
        <div className="border-4 border-red-500 bg-white p-12 text-center font-black uppercase text-xl text-red-600 shadow-[6px_6px_0px_#18181b]">
          {t('catalog.loadError')}
        </div>
      )}

      {status === 'ready' && (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const colors = getCategoryColors(collection.categoryId ?? 'SPORTS');
            return (
              <article
                className="group flex flex-col border-4 border-zinc-900 bg-white transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#18181b] shadow-[4px_4px_0px_#18181b]"
                key={collection.id}
              >
                <div className={`flex h-36 items-center justify-center border-b-4 border-zinc-900 ${colors.bg}`}>
                  <span className={`text-4xl font-black uppercase tracking-widest ${colors.text} drop-shadow-[2px_2px_0px_#18181b] px-4 text-center`}>
                    {collection.name}
                  </span>
                </div>
                
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4">
                    <span className={`inline-block border-2 border-zinc-900 px-3 py-1 text-sm font-black uppercase shadow-[2px_2px_0px_#18181b] ${colors.bg} ${colors.badgeText}`}>
                      {collection.categoryId ?? 'SPORTS'}
                    </span>
                  </div>
                  
                  <h2 className="mb-2 text-2xl font-black uppercase text-zinc-900">
                    {collection.name}
                  </h2>
                  <p className="mb-6 flex-1 text-base font-bold text-zinc-500">
                    {collection.description}
                  </p>
                  
                  <div className="mb-6 flex justify-between border-t-4 border-zinc-900 pt-4 text-sm font-black text-zinc-900 uppercase">
                    <span>{collection.releaseYear ?? t('common.notAvailable')}</span>
                    <span>{collection.totalStickers} {t('collection.totalStickers')}</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="block w-full border-4 border-zinc-900 bg-white px-4 py-3 text-center font-black uppercase text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:bg-zinc-100 hover:shadow-[6px_6px_0px_#18181b]"
                    >
                      Ver Detalhes
                    </Link>
                    <div className="border-4 border-zinc-900 shadow-[4px_4px_0px_#18181b] transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#18181b]">
                      <StartCollectionButton collectionId={collection.id} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
