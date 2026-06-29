'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/config';
import { Link } from '../../i18n/navigation';
import { apiRequest } from '../../lib/api';
import { accessTokenKey } from '../../lib/auth';
import type {
  CollectionSection,
  CollectionSummary,
  StickerPage,
  StickerSummary,
} from '../../lib/catalog';
import { Avatar } from './avatar';
import { StartCollectionButton } from '../collections/start-collection-button';
import { ArrowLeft } from 'lucide-react';

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

    void apiRequest<CollectionSummary>(
      `/collections/${slug}?locale=${locale}`
    )
      .then(async (loadedCollection) => {
        const [loadedSections, loadedStickers] = await Promise.all([
          apiRequest<CollectionSection[]>(
            `/collections/${loadedCollection.id}/sections?locale=${locale}`
          ),
          apiRequest<StickerPage>(
            `/collections/${loadedCollection.id}/stickers?${query}`
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
        <header className="mb-5 border-b-4 border-zinc-900 pb-5">
          <Link 
            className="mb-8 inline-flex items-center gap-2 border-2 border-zinc-900 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]" 
            href="/"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            {t('common.backDashboard')}
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tight text-zinc-900 sm:text-6xl drop-shadow-[4px_4px_0px_#14b8a6]">
                {collection.name}
              </h1>
              <p className="mt-2 inline-block border-2 border-zinc-900 bg-yellow-300 px-3 py-1 text-sm font-black uppercase shadow-[2px_2px_0px_#18181b]">
                {t('collection.summary', {
                  year: collection.releaseYear ?? t('common.notAvailable'),
                  count: collection.totalStickers,
                })}
              </p>
            </div>
            <div className="block w-full shrink-0 sm:w-64 border-4 border-zinc-900 shadow-[8px_8px_0px_#18181b] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#18181b]">
              <StartCollectionButton collectionId={collection.id} />
            </div>
          </div>
          {collection.description ? (
            <p className="mt-6 max-w-3xl text-xl font-bold text-zinc-700">
              {collection.description}
            </p>
          ) : null}
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
      className="mb-12 grid gap-4 border-4 border-zinc-900 bg-emerald-300 p-6 shadow-[8px_8px_0px_#18181b] md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ ...filters, search, page: 1 });
      }}
    >
      <input
        aria-label={t('catalog.search')}
        className="border-2 border-zinc-900 bg-white px-4 py-3 font-bold text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 shadow-[2px_2px_0px_#18181b]"
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('catalog.searchPlaceholder')}
        value={search}
      />
      <select
        aria-label={t('catalog.sectionFilter')}
        className="border-2 border-zinc-900 bg-white px-4 py-3 font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 shadow-[2px_2px_0px_#18181b]"
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
        className="border-2 border-zinc-900 bg-white px-4 py-3 font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 shadow-[2px_2px_0px_#18181b]"
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
      <div className="flex gap-4">
        <select
          aria-label={t('catalog.sort')}
          className="min-w-0 flex-1 border-2 border-zinc-900 bg-white px-3 py-3 font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 shadow-[2px_2px_0px_#18181b]"
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
          className="border-2 border-zinc-900 bg-red-500 px-6 font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
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
    <article className="flex gap-4 border-4 border-zinc-900 bg-white p-5 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#18181b]">
      <Avatar imageUrl={sticker.player?.image?.url} name={displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="border-b-2 border-zinc-900 text-lg font-black text-zinc-900">{sticker.code}</p>
          <span className="border-2 border-zinc-900 bg-sky-300 px-2 py-1 text-xs font-black uppercase text-zinc-900 shadow-[2px_2px_0px_#18181b]">
            {t(`stickerTypes.${sticker.type}`)}
          </span>
        </div>
        <h2 className="mt-3 truncate text-xl font-black uppercase text-zinc-900">{sticker.name}</h2>
        <p className="mt-1 text-sm font-bold uppercase text-zinc-500">
          {sticker.section?.name ?? t('catalog.noSection')}
        </p>
        {sticker.player ? (
          <p className="mt-2 text-sm font-black uppercase text-zinc-700">{sticker.player.name}</p>
        ) : null}
        <Link
          className="mt-6 inline-block border-2 border-zinc-900 bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[2px_2px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181b]"
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
    <nav className="mt-12 flex items-center justify-center gap-6">
      <button
        className="border-2 border-zinc-900 bg-zinc-200 px-5 py-3 font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#18181b]"
        disabled={page <= 1}
        onClick={() => onChange({ ...filters, page: page - 1 })}
        type="button"
      >
        {t('pagination.previous')}
      </button>
      <span className="font-black uppercase tracking-widest text-zinc-900">{t('pagination.page', { page, totalPages })}</span>
      <button
        className="border-2 border-zinc-900 bg-zinc-200 px-5 py-3 font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#18181b]"
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
    <div className="border-4 border-dashed border-zinc-900 bg-zinc-100 p-12 text-center text-xl font-black uppercase text-zinc-500">
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
