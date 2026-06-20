'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '../../i18n/navigation';
import { accessTokenKey } from '../../lib/auth';
import type { Locale } from '../../i18n/config';
import {
  usePersonalCollectionProgress,
  usePersonalStickers,
} from '../../hooks/use-personal-collection';
import { PersonalStickerCard } from './cards/personal-sticker-card';

const stickerTypes = [
  'PLAYER',
  'TEAM',
  'BADGE',
  'STADIUM',
  'TROPHY',
  'MASCOT',
  'SPECIAL',
  'OTHER',
] as const;

type Filters = {
  search: string;
  sectionId: string;
  type: string;
  status: string;
  sort: string;
  page: number;
};

export function GlobalStickersClient({
  userCollectionId,
}: {
  userCollectionId: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(() => readFilters());

  const token =
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(accessTokenKey);

  const progress = usePersonalCollectionProgress(userCollectionId, locale, token);

  const stickerQueryString = buildStickerQuery(locale, filters);
  const stickers = usePersonalStickers(
    userCollectionId,
    token,
    stickerQueryString.toString()
  );

  if (!token && typeof window !== 'undefined') {
    router.replace('/login');
    return null;
  }

  if (progress.isError || stickers.isError) {
    return <StateMessage message={t('myCollections.loadError')} />;
  }

  function applyFilters(next: Filters) {
    setFilters(next);
    const query = new URLSearchParams();
    if (next.search) query.set('search', next.search);
    if (next.sectionId) query.set('sectionId', next.sectionId);
    if (next.type) query.set('type', next.type);
    if (next.status !== 'all') query.set('status', next.status);
    if (next.sort !== 'albumOrder') query.set('sort', next.sort);
    if (next.page > 1) query.set('page', String(next.page));
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query.size ? `?${query}` : ''}`
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500">
        <Link className="text-sky-700 hover:underline" href="/my-collections">
          {t('navigation.myCollections')}
        </Link>
        <span>/</span>
        <Link
          className="text-sky-700 hover:underline"
          href={`/my-collections/${userCollectionId}`}
        >
          {t('common.backCollection')}
        </Link>
      </nav>

      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-4xl font-black text-slate-800">
          {t('myCollections.globalSearch')}
        </h1>
      </header>

      <PersonalFilters
        filters={filters}
        onChange={applyFilters}
        sections={progress.data?.sections ?? []}
      />

      {stickers.isPending ? (
        <StateMessage message={t('common.loading')} />
      ) : stickers.data?.data.length ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stickers.data.data.map((sticker) => (
              <PersonalStickerCard
                key={sticker.id}
                sticker={sticker}
                token={token!}
                userCollectionId={userCollectionId}
              />
            ))}
          </div>
          <Pagination
            filters={filters}
            onChange={applyFilters}
            page={stickers.data.pagination.page}
            totalPages={stickers.data.pagination.totalPages}
          />
        </>
      ) : (
        <StateMessage message={t('myCollections.noStickers')} />
      )}
    </div>
  );
}

function PersonalFilters({
  filters,
  onChange,
  sections,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  sections: Array<{ sectionId: string; name: string }>;
}) {
  const t = useTranslations();
  const [search, setSearch] = useState(filters.search);
  return (
    <form
      className="mb-10 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ ...filters, search, page: 1 });
      }}
    >
      <input
        aria-label={t('catalog.search')}
        className="rounded-2xl border border-slate-300 px-4 py-3"
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        value={search}
      />
      <select
        aria-label={t('myCollections.statusFilter')}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value, page: 1 })
        }
        value={filters.status}
      >
        <option value="all">{t('myCollections.statusAll')}</option>
        <option value="owned">{t('myCollections.statusOwned')}</option>
        <option value="missing">{t('myCollections.statusMissing')}</option>
        <option value="duplicates">{t('myCollections.statusDuplicates')}</option>
      </select>
      <select
        aria-label={t('catalog.sectionFilter')}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
        onChange={(event) =>
          onChange({ ...filters, sectionId: event.target.value, page: 1 })
        }
        value={filters.sectionId}
      >
        <option value="">{t('catalog.allSections')}</option>
        {sections.map((section) => (
          <option key={section.sectionId} value={section.sectionId}>
            {section.name}
          </option>
        ))}
      </select>
      <select
        aria-label={t('catalog.typeFilter')}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
        onChange={(event) =>
          onChange({ ...filters, type: event.target.value, page: 1 })
        }
        value={filters.type}
      >
        <option value="">{t('catalog.allTypes')}</option>
        {stickerTypes.map((type) => (
          <option key={type} value={type}>
            {t(`stickerTypes.${type}`)}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select
          aria-label={t('catalog.sort')}
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-3"
          onChange={(event) =>
            onChange({ ...filters, sort: event.target.value, page: 1 })
          }
          value={filters.sort}
        >
          <option value="albumOrder">{t('sort.albumOrder')}</option>
          <option value="code">{t('sort.code')}</option>
          <option value="name">{t('sort.name')}</option>
        </select>
        <button
          className="rounded-2xl bg-sky-600 px-4 font-bold text-white transition-colors hover:bg-sky-700"
          type="submit"
        >
          {t('common.search')}
        </button>
      </div>
    </form>
  );
}

function Pagination({
  filters,
  onChange,
  page,
  totalPages,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  page: number;
  totalPages: number;
}) {
  const t = useTranslations();
  return (
    <nav className="mt-8 flex items-center justify-center gap-4">
      <button
        className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold transition-colors hover:bg-slate-50 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onChange({ ...filters, page: page - 1 })}
        type="button"
      >
        {t('pagination.previous')}
      </button>
      <span className="font-bold text-slate-500">
        {t('pagination.page', { page, totalPages })}
      </span>
      <button
        className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold transition-colors hover:bg-slate-50 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onChange({ ...filters, page: page + 1 })}
        type="button"
      >
        {t('pagination.next')}
      </button>
    </nav>
  );
}

function StateMessage({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-lg font-bold text-slate-500">
      {message}
    </div>
  );
}

function buildStickerQuery(locale: Locale, filters: Filters) {
  const query = new URLSearchParams({
    locale,
    status: filters.status,
    sort: filters.sort,
    page: String(filters.page),
    limit: '24',
  });
  if (filters.search) query.set('search', filters.search);
  if (filters.sectionId) query.set('sectionId', filters.sectionId);
  if (filters.type) query.set('type', filters.type);
  return query;
}

function readFilters(): Filters {
  if (typeof window === 'undefined') {
    return {
      search: '',
      sectionId: '',
      type: '',
      status: 'all',
      sort: 'albumOrder',
      page: 1,
    };
  }
  const query = new URLSearchParams(window.location.search);
  return {
    search: query.get('search') ?? '',
    sectionId: query.get('sectionId') ?? '',
    type: query.get('type') ?? '',
    status: query.get('status') ?? 'all',
    sort: query.get('sort') ?? 'albumOrder',
    page: Number(query.get('page') ?? 1),
  };
}
