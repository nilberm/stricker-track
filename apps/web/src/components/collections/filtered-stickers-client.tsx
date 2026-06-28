'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '../../i18n/navigation';
import { accessTokenKey } from '../../lib/auth';
import type { Locale } from '../../i18n/config';
import { usePersonalStickers } from '../../hooks/use-personal-collection';
import { PersonalStickerCard } from './cards/personal-sticker-card';
import { useState, useEffect } from 'react';

export function FilteredStickersClient({
  userCollectionId,
  mode,
}: {
  userCollectionId: string;
  mode: 'missing' | 'repeated';
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const token =
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(accessTokenKey);

  const qs = new URLSearchParams({
    locale,
    status: mode === 'missing' ? 'missing' : 'duplicates',
    sort: 'albumOrder',
    page: String(page),
    limit: '48',
  });
  
  if (search) {
    qs.set('search', search);
  }

  const stickers = usePersonalStickers(userCollectionId, token, qs.toString());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  if (!token && typeof window !== 'undefined') {
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <Link
            className="mb-4 inline-block rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm font-bold uppercase tracking-widest text-amber-500 transition hover:bg-zinc-800"
            href={`/my-collections/${userCollectionId}`}
          >
            ← {t('common.backCollection')}
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black text-amber-500 drop-shadow-md">
            {mode === 'missing' ? 'Taverna dos Faltantes' : 'Mercado de Trocas'}
          </h1>
          <p className="mt-4 text-sm sm:text-base font-semibold text-zinc-400">
            {mode === 'missing'
              ? 'O mural de recompensas. As lendas que faltam para sua glória.'
              : 'Seu tesouro acumulado. Figurões prontos para negociação.'}
          </p>
          
          <div className="mt-8 max-w-md mx-auto">
            <input
              type="search"
              placeholder={t('catalog.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset page on new search
              }}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-zinc-200 placeholder-zinc-500 shadow-inner focus:border-amber-500 focus:outline-none"
            />
          </div>
        </header>

        {stickers.isPending ? (
          <div className="py-20 text-center text-xl font-bold tracking-widest text-zinc-600 uppercase">
            {t('common.loading')}
          </div>
        ) : stickers.data?.data.length ? (
          <>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {stickers.data.data.map((sticker) => (
                <PersonalStickerCard
                  key={sticker.id}
                  sticker={sticker}
                  token={token!}
                  userCollectionId={userCollectionId}
                />
              ))}
            </div>
            
            <nav className="mt-12 flex items-center justify-center gap-6">
              <button
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 font-bold text-amber-500 transition hover:bg-zinc-800 disabled:opacity-30"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                type="button"
              >
                {t('pagination.previous')}
              </button>
              <span className="font-bold text-zinc-500">
                {t('pagination.page', { page, totalPages: stickers.data.pagination.totalPages })}
              </span>
              <button
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 font-bold text-amber-500 transition hover:bg-zinc-800 disabled:opacity-30"
                disabled={page >= stickers.data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                type="button"
              >
                {t('pagination.next')}
              </button>
            </nav>
          </>
        ) : (
          <div className="py-20 text-center text-xl font-bold tracking-widest text-zinc-600 uppercase">
            {t('myCollections.noStickers')}
          </div>
        )}
      </div>
    </div>
  );
}
