'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '../../i18n/navigation';
import { useState, useEffect } from 'react';
import { accessTokenKey } from '../../lib/auth';
import type { Locale } from '../../i18n/config';
import { usePersonalCollection, usePersonalCollectionProgress, useToggleCollectionVisibility } from '../../hooks/use-personal-collection';
import { CollectorSidebar } from './collector-sidebar';
import { TransferModal } from './transfer-modal';
import { useThemeStore } from '../../stores/theme-store';

function getFlagUrl(sectionCode: string, iso2: string | null) {
  if (sectionCode === 'ENG') return '/flags/england.png';
  if (sectionCode === 'SCO') return '/flags/scotland.png';
  return `https://flagcdn.com/w160/${(iso2 || sectionCode.substring(0, 2)).toLowerCase()}.png`;
}

function BetaCollectionOverview({ userCollectionId, detail, progress, token }: { userCollectionId: string, detail: any, progress: any, token: string | null }) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const toggleVisibility = useToggleCollectionVisibility(userCollectionId, token);



  if (detail.isError || progress.isError) {
    return <StateMessage message={t('myCollections.loadError')} />;
  }

  const sections = progress.data?.sections || [];
  const totalStickers = progress.data?.totalStickers || 0;
  const collectedStickers = progress.data?.ownedUnique || 0;
  const duplicateStickers = progress.data?.duplicates || 0;
  const missingStickers = progress.data?.missing || 0;
  const globalPercentage = progress.data?.completionPercentage || 0;
  
  const specialSections = sections.filter((s: any) => s.type !== 'NATIONAL_TEAM');
  const nationalTeams = sections.filter((s: any) => s.type === 'NATIONAL_TEAM');

  const chunkedTeams = [];
  for (let i = 0; i < nationalTeams.length; i += 4) {
    chunkedTeams.push(nationalTeams.slice(i, i + 4));
  }

  const [instantFilter, setInstantFilter] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTab, setTransferTab] = useState<'import' | 'export'>('import');
  const [isVisDropdownOpen, setIsVisDropdownOpen] = useState(false);
  const [isTransferDropdownOpen, setIsTransferDropdownOpen] = useState(false);
  const isFiltering = instantFilter.length > 0;
  const filteredSections = isFiltering ? sections.filter((s: any) => s.code.startsWith(instantFilter)) : [];

  return (
    <div className="min-h-screen lg:pl-[76px] bg-[#0d2a18]">
      {progress.data && (
        <CollectorSidebar 
          progress={progress.data} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      )}
      <div className="mx-auto max-w-7xl px-5 py-10">
      <header className="mb-12 border-b-4 border-[#1a472a] pb-10">
        <Link 
          className="mb-8 inline-flex items-center gap-2 border-2 border-zinc-900 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]" 
          href="/my-collections"
        >
          {t('myCollections.back')}
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white sm:text-6xl drop-shadow-[4px_4px_0px_#1a472a]">
            {detail.data?.collection.name ?? t('common.loading')}
          </h1>
        </div>
        {detail.data?.collection.description && (
          <p className="mt-6 max-w-3xl text-xl font-bold text-white">
            {detail.data.collection.description}
          </p>
        )}
      </header>

      {progress.data && (
        <div className="mb-8 block lg:hidden overflow-hidden border-4 border-zinc-900 bg-white shadow-[8px_8px_0px_#18181b]">
          <div className="p-5">
            <div className="flex items-end justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Progresso global</p>
                <p className="mt-1 text-3xl font-black text-zinc-900">{globalPercentage}%</p>
              </div>
              <p className="pb-1 text-sm font-black text-zinc-500">{collectedStickers}/{totalStickers}</p>
            </div>
            <div className="h-3 border-2 border-zinc-900 bg-zinc-200 overflow-hidden">
              <div className="h-full bg-amber-400 transition-all duration-500 border-r-2 border-zinc-900" style={{ width: `${Math.min(globalPercentage, 100)}%` }} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 divide-x-2 divide-zinc-900 border-t-4 border-zinc-900 bg-zinc-100">
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Coladas</span>
              <span className="mt-1 text-base font-black text-emerald-500">{collectedStickers}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Faltam</span>
              <span className="mt-1 text-base font-black text-red-500">{missingStickers}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Repetidas</span>
              <span className="mt-1 text-base font-black text-violet-500">{duplicateStickers}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col gap-4 max-w-xl mx-auto lg:max-w-none lg:mx-0">
        {/* Row 1: Instant Filter */}
        <div className="w-full relative">
          <label htmlFor="globalSearch" className="sr-only">{t('overview.searchAria')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="text-xl">🔍</span>
            </div>
            <input
              id="globalSearch"
              type="text"
              className="w-full border-4 border-zinc-900 bg-emerald-300 px-4 py-4 pl-12 text-base font-black tracking-[0.2em] text-zinc-900 placeholder:text-zinc-600 outline-none focus:bg-emerald-400 shadow-[8px_8px_0px_#18181b] uppercase"
              placeholder={t('overview.searchPlaceholder')}
              value={instantFilter}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
                setInstantFilter(val);
              }}
            />
          </div>
        </div>

        {/* Row 2: Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          {/* Primary Action */}
          <Link
            href={`/my-collections/${userCollectionId}/stickers`}
            className="flex items-center justify-center gap-2 border-2 border-zinc-900 bg-amber-400 px-6 py-3 text-sm font-black text-zinc-900 transition-all sm:w-auto w-full shadow-[4px_4px_0px_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
          >
            <span className="text-base">📋</span>
            <span className="tracking-widest uppercase">{t('collectionOverview.actions.explore')}</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Visibility Control */}
            {detail.data && (
              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => {
                    setIsVisDropdownOpen(!isVisDropdownOpen);
                    setIsTransferDropdownOpen(false);
                  }}
                  onBlur={() => setTimeout(() => setIsVisDropdownOpen(false), 150)}
                  className={`flex h-full w-full items-center justify-center gap-2 border-2 border-zinc-900 px-4 py-3 text-sm font-black transition-all shadow-[4px_4px_0px_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b] ${
                    detail.data.isPublic 
                      ? 'bg-teal-300 text-zinc-900' 
                      : 'bg-zinc-200 text-zinc-900'
                  }`}
                >
                  <span className="text-base">{detail.data.isPublic ? '🌎' : '🔒'}</span>
                  <span className="tracking-widest uppercase">
                    {detail.data.isPublic ? t('collectionOverview.actions.public') : t('collectionOverview.actions.private')}
                  </span>
                  <span className="text-[10px] ml-1">▼</span>
                </button>
                
                {isVisDropdownOpen && (
                  <div className="absolute left-0 sm:left-auto top-full mt-3 w-64 flex-col border-4 border-zinc-900 bg-white shadow-[8px_8px_0px_#18181b] flex z-10">
                    <button
                      onClick={() => toggleVisibility.mutate(true)}
                      className="flex flex-col items-start p-3 hover:bg-teal-100 transition-colors text-left border-b-2 border-zinc-900"
                    >
                      <span className="text-sm font-black text-teal-700 uppercase">🌎 {t('collectionOverview.actions.public')}</span>
                      <span className="text-xs font-bold text-zinc-600 mt-1">{t('collectionOverview.actions.publicDesc')}</span>
                    </button>
                    <button
                      onClick={() => toggleVisibility.mutate(false)}
                      className="flex flex-col items-start p-3 hover:bg-zinc-100 transition-colors text-left"
                    >
                      <span className="text-sm font-black text-zinc-900 uppercase">🔒 {t('collectionOverview.actions.private')}</span>
                      <span className="text-xs font-bold text-zinc-600 mt-1">{t('collectionOverview.actions.privateDesc')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Transfer Control */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => {
                  setIsTransferDropdownOpen(!isTransferDropdownOpen);
                  setIsVisDropdownOpen(false);
                }}
                onBlur={() => setTimeout(() => setIsTransferDropdownOpen(false), 150)}
                className="flex h-full w-full items-center justify-center gap-2 border-2 border-zinc-900 bg-[#2b3088] px-4 py-3 text-sm font-black text-white transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-[4px_4px_0px_#18181b] hover:shadow-[6px_6px_0px_#18181b]"
              >
                <span className="text-base">⇅</span>
                <span className="tracking-widest uppercase">
                  {t('collectionOverview.actions.transfer')}
                </span>
                <span className="text-[10px] ml-1 text-zinc-400">▼</span>
              </button>
              
              {isTransferDropdownOpen && (
                <div className="absolute right-0 sm:right-auto top-full mt-3 w-48 flex-col border-4 border-zinc-900 bg-white shadow-[8px_8px_0px_#18181b] flex z-10">
                  <button
                    onClick={() => {
                      setTransferTab('import');
                      setIsTransferModalOpen(true);
                    }}
                    className="flex items-center gap-2 p-3 hover:bg-zinc-100 transition-colors text-left border-b-2 border-zinc-900"
                  >
                    <span className="text-base">📥</span>
                    <span className="text-sm font-black uppercase text-zinc-900">{t('collectionOverview.actions.import')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setTransferTab('export');
                      setIsTransferModalOpen(true);
                    }}
                    className="flex items-center gap-2 p-3 hover:bg-zinc-100 transition-colors text-left"
                  >
                    <span className="text-base">📤</span>
                    <span className="text-sm font-black uppercase text-zinc-900">{t('collectionOverview.actions.export')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFiltering ? (
        <section className="mb-8 border-t border-amber-900/50 pt-8 min-h-[40vh]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500/80 mb-4">
            Resultado da Busca: {instantFilter}
          </h2>
          {filteredSections.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
              {filteredSections.map((section: any) => (
                <CompactSectionCard key={section.sectionId} section={section} userCollectionId={userCollectionId} />
              ))}
            </div>
          ) : (
            <div className="text-zinc-400 font-bold italic">Nenhuma seleção encontrada com essa sigla.</div>
          )}
        </section>
      ) : (
        <>
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
              {/* FWC / Especiais */}
              <div className="flex flex-col gap-2">
                <div className="w-full">
                  <h2 className="inline-block max-w-full break-words text-xs font-black uppercase tracking-widest text-white border-b-4 border-[#1a472a] pb-1">
                    {t('collectionOverview.sections.fwc')} / FWC History
                  </h2>
                </div>
                <div className="flex flex-col gap-1.5">
                  {specialSections.map((section: any) => (
                    <CompactSectionCard key={section.sectionId} section={section} userCollectionId={userCollectionId} />
                  ))}
                  {specialSections.length === 0 && (
                    <div className="text-sm text-zinc-400 italic">Nenhuma seção especial encontrada.</div>
                  )}
                </div>
              </div>
              {/* Coca-Cola Placeholder */}
              <div className="flex flex-col gap-2">
                <div className="w-full">
                  <h2 className="inline-block max-w-full break-words text-xs font-black uppercase tracking-widest text-white border-b-4 border-[#1a472a] pb-1">
                    Coca-Cola & Extra Series
                  </h2>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="group relative flex items-center h-10 w-full border-2 border-dashed border-zinc-500 bg-zinc-100 opacity-70 cursor-not-allowed">
                    <div className="flex w-10 sm:w-12 shrink-0 items-center justify-center h-full border-r-2 border-dashed border-zinc-500 bg-zinc-200">
                      <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-zinc-500">C1-C8</span>
                    </div>
                    <div className="flex w-10 sm:w-12 shrink-0 items-center justify-center h-full border-r-2 border-dashed border-zinc-500 bg-zinc-100 p-1.5">
                      <span className="text-sm grayscale opacity-70">🥤</span>
                    </div>
                    <div className="flex-1 px-3 min-w-0">
                      <span className="block truncate text-xs sm:text-sm font-black uppercase text-zinc-500">Coca-Cola Team Believers</span>
                    </div>
                    <div className="flex shrink-0 items-center justify-end px-3 h-full">
                      <span className="text-[9px] font-black uppercase text-zinc-900 bg-yellow-300 px-1.5 py-0.5 border border-zinc-900 shadow-[1px_1px_0px_#18181b]">Em breve</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mb-12 border-t-4 border-zinc-900 pt-10 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
            {chunkedTeams.map((chunk: any[], index: number) => (
              <div key={`group-${index}`} className="flex flex-col gap-2">
                <div className="w-full">
                  <h2 className="inline-block max-w-full break-words text-xs font-black uppercase tracking-widest text-white border-b-4 border-[#1a472a] pb-1">
                    Grupo {String.fromCharCode(65 + index)}
                  </h2>
                </div>
                <div className="flex flex-col gap-1.5">
                  {chunk.map((section: any) => (
                    <CompactSectionCard key={section.sectionId} section={section} userCollectionId={userCollectionId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        userCollectionId={userCollectionId}
        token={token!}
        initialTab={transferTab}
      />
    </div>
  );
}

function CompactSectionCard({ section, userCollectionId }: { section: any; userCollectionId: string }) {
  const isNationalTeam = section.type === 'NATIONAL_TEAM';
  
  return (
    <Link
      href={`/my-collections/${userCollectionId}/sections/${section.sectionId}`}
      className="group relative flex items-center h-10 w-full border-2 border-zinc-900 bg-white transition-all hover:bg-zinc-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181b]"
    >
      {/* Code Strip */}
      <div className="flex w-10 sm:w-12 shrink-0 items-center justify-center h-full border-r-2 border-zinc-900 bg-zinc-200">
        <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-zinc-900 transition-colors">
          {section.code}
        </span>
      </div>
      
      {/* Flag/Icon */}
      <div className="flex w-10 sm:w-12 shrink-0 items-center justify-center h-full border-r-2 border-zinc-900 bg-zinc-100 p-1.5">
        {isNationalTeam ? (
          <img 
            src={getFlagUrl(section.code, section.countryIso2)} 
            className="h-full w-full object-contain border border-zinc-900" 
            alt={section.name} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
        ) : (
          <span className="text-[10px] font-black text-zinc-900 transition-colors">
            {section.code.substring(0, 3)}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 px-3 min-w-0">
        <span className="block truncate text-xs sm:text-sm font-black uppercase text-zinc-900 transition-colors">
          {section.name}
        </span>
      </div>

      {/* Progress Stats */}
      <div className="flex w-16 sm:w-20 shrink-0 flex-col items-end justify-center px-2 sm:px-3 h-full border-l-2 border-zinc-900 bg-white z-10">
        <span className="text-xs sm:text-sm font-black text-zinc-900">
          {section.percentage}%
        </span>
      </div>

      {/* Progress Bar (Bottom Line) */}
      <div className="absolute inset-x-0 bottom-0 h-[4px] bg-transparent border-t-2 border-zinc-900 z-0">
        <div 
          className="h-full bg-amber-400 border-r-2 border-zinc-900 transition-all duration-500" 
          style={{ width: `${section.percentage}%` }} 
        />
      </div>
    </Link>
  );
}


function StateMessage({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-[#1a472a] bg-[#0d2a18] p-12 text-center text-lg font-bold text-white shadow-[8px_8px_0px_#18181b] mx-5 mt-10 max-w-2xl lg:mx-auto">
      {message}
    </div>
  );
}

// TODO: Create a separate file for WorldCupCollectionOverview later
function WorldCupCollectionOverview({ userCollectionId, detail, progress, token }: { userCollectionId: string, detail: any, progress: any, token: string | null }) {
  // We reuse Beta for now as a starting point, but the user will modify it
  return <BetaCollectionOverview userCollectionId={userCollectionId} detail={detail} progress={progress} token={token} />;
}

export function CollectionOverviewClient({ userCollectionId }: { userCollectionId: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();

  const token = typeof window === 'undefined' ? null : window.localStorage.getItem(accessTokenKey);
  const detail = usePersonalCollection(userCollectionId, locale, token);
  const progress = usePersonalCollectionProgress(userCollectionId, locale, token);
  const setTheme = useThemeStore(s => s.setTheme);

  useEffect(() => {
    if (detail.data?.collection.slug) {
      setTheme(detail.data.collection.slug);
    }
    return () => setTheme('default');
  }, [detail.data?.collection.slug, setTheme]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!token) {
    return null;
  }
  if (detail.isError || progress.isError) {
    return <StateMessage message={t('myCollections.loadError')} />;
  }

  if (detail.isLoading || progress.isLoading) {
    return null; // Or a loading skeleton
  }

  const theme = detail.data?.collection.slug;

  if (theme === 'world-cup-2026') {
    return <WorldCupCollectionOverview userCollectionId={userCollectionId} detail={detail} progress={progress} token={token} />;
  }

  return <BetaCollectionOverview userCollectionId={userCollectionId} detail={detail} progress={progress} token={token} />;
}
