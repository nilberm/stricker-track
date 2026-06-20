'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/config';
import { Link } from '../../i18n/navigation';
import { authenticatedApiRequest } from '../../lib/api';
import { accessTokenKey } from '../../lib/auth';
import type {
  CollectionSection,
  CollectionSummary,
  StickerPage,
  StickerSummary,
} from '../../lib/catalog';
import { Avatar } from './avatar';
import { StartCollectionButton } from '../collections/start-collection-button';

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
  sort: string;
  page: number;
  limit: number;
};

export function CollectionCatalogClient({ slug }: { slug: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [collection, setCollection] = useState<CollectionSummary | null>(null);
  const [sections, setSections] = useState<CollectionSection[]>([]);
  const [stickers, setStickers] = useState<StickerPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [filters, setFilters] = useState<Filters>(() => readFilters());

  useEffect(() => {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    const query = new URLSearchParams({
      locale,
      sort: filters.sort,
      page: String(filters.page),
      limit: String(filters.limit),
    });
    if (filters.search) query.set('search', filters.search);
    if (filters.sectionId) query.set('sectionId', filters.sectionId);
    if (filters.type) query.set('type', filters.type);

    void authenticatedApiRequest<CollectionSummary>(
      `/collections/${slug}?locale=${locale}`,
      token,
    )
      .then(async (loadedCollection) => {
        const [loadedSections, loadedStickers] = await Promise.all([
          authenticatedApiRequest<CollectionSection[]>(
            `/collections/${loadedCollection.id}/sections?locale=${locale}`,
            token,
          ),
          authenticatedApiRequest<StickerPage>(
            `/collections/${loadedCollection.id}/stickers?${query}`,
            token,
          ),
        ]);
        setCollection(loadedCollection);
        setSections(loadedSections);
        setStickers(loadedStickers);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [filters, locale, slug]);

  function applyFilters(next: Filters) {
    setFilters(next);
    const query = new URLSearchParams();
    if (next.search) query.set('search', next.search);
    if (next.sectionId) query.set('sectionId', next.sectionId);
    if (next.type) query.set('type', next.type);
    if (next.sort !== 'albumOrder') query.set('sort', next.sort);
    if (next.page > 1) query.set('page', String(next.page));
    if (next.limit !== 24) query.set('limit', String(next.limit));
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query.size ? `?${query}` : ''}`,
    );
  }

  if (status === 'error') {
    return <StateMessage message={t('catalog.loadError')} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      {collection ? (
        <header className="mb-8">
          <Link className="text-sm font-bold text-sky-700" href="/dashboard">
            {t('common.backDashboard')}
          </Link>
          <h1 className="mt-4 text-4xl font-black">{collection.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-7 text-slate-600">
            {collection.description}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {t('collection.summary', {
              year: collection.releaseYear ?? t('common.notAvailable'),
              count: collection.totalStickers,
            })}
          </p>
          <div className="mt-5 inline-flex">
            <StartCollectionButton collectionId={collection.id} />
          </div>
        </header>
      ) : null}

      <CatalogFilters
        filters={filters}
        onChange={applyFilters}
        sections={sections}
      />

      {status === 'loading' ? (
        <StateMessage message={t('common.loading')} />
      ) : stickers?.data.length ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stickers.data.map((sticker) => (
              <StickerCard key={sticker.id} slug={slug} sticker={sticker} />
            ))}
          </div>
          <Pagination
            filters={filters}
            onChange={applyFilters}
            page={stickers.pagination.page}
            totalPages={stickers.pagination.totalPages}
          />
        </>
      ) : (
        <StateMessage message={t('catalog.empty')} />
      )}
    </div>
  );
}

function CatalogFilters({
  filters,
  onChange,
  sections,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  sections: CollectionSection[];
}) {
  const t = useTranslations();
  const [search, setSearch] = useState(filters.search);
  return (
    <form
      className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ ...filters, search, page: 1 });
      }}
    >
      <input
        aria-label={t('catalog.search')}
        className="rounded-xl border border-slate-300 px-4 py-3"
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        value={search}
      />
      <select
        aria-label={t('catalog.sectionFilter')}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
        onChange={(event) =>
          onChange({ ...filters, sectionId: event.target.value, page: 1 })
        }
        value={filters.sectionId}
      >
        <option value="">{t('catalog.allSections')}</option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.name}
          </option>
        ))}
      </select>
      <select
        aria-label={t('catalog.typeFilter')}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
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
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3"
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
          className="rounded-xl bg-sky-600 px-4 font-bold text-white"
          type="submit"
        >
          {t('common.search')}
        </button>
      </div>
    </form>
  );
}

function StickerCard({
  slug,
  sticker,
}: {
  slug: string;
  sticker: StickerSummary;
}) {
  const t = useTranslations();
  const displayName =
    sticker.player?.displayName ?? sticker.player?.name ?? sticker.name;
  return (
    <article className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Avatar imageUrl={sticker.player?.image?.url} name={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-black text-sky-700">{sticker.code}</p>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">
            {t(`stickerTypes.${sticker.type}`)}
          </span>
        </div>
        <h2 className="mt-2 truncate text-lg font-black">{sticker.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {sticker.section?.name ?? t('catalog.noSection')}
        </p>
        {sticker.player ? (
          <p className="mt-1 text-sm font-semibold">{sticker.player.name}</p>
        ) : null}
        <Link
          className="mt-4 inline-block text-sm font-bold text-sky-700"
          href={`/collections/${slug}/stickers/${sticker.id}`}
        >
          {t('catalog.viewDetails')}
        </Link>
      </div>
    </article>
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
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onChange({ ...filters, page: page - 1 })}
        type="button"
      >
        {t('pagination.previous')}
      </button>
      <span>{t('pagination.page', { page, totalPages })}</span>
      <button
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold disabled:opacity-40"
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
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      {message}
    </div>
  );
}

function readFilters(): Filters {
  if (typeof window === 'undefined') {
    return {
      search: '',
      sectionId: '',
      type: '',
      sort: 'albumOrder',
      page: 1,
      limit: 24,
    };
  }
  const query = new URLSearchParams(window.location.search);
  return {
    search: query.get('search') ?? '',
    sectionId: query.get('sectionId') ?? '',
    type: query.get('type') ?? '',
    sort: query.get('sort') ?? 'albumOrder',
    page: Number(query.get('page') ?? 1),
    limit: Number(query.get('limit') ?? 24),
  };
}
