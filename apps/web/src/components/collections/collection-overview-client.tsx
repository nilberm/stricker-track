'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '../../i18n/navigation';
import { useState } from 'react';
import { accessTokenKey } from '../../lib/auth';
import type { Locale } from '../../i18n/config';
import { usePersonalCollection, usePersonalCollectionProgress } from '../../hooks/use-personal-collection';
import { CollectorSidebar } from './collector-sidebar';

function getFlagUrl(sectionCode: string, iso2: string | null) {
  if (sectionCode === 'ENG') return '/flags/england.png';
  if (sectionCode === 'SCO') return '/flags/scotland.png';
  return `https://flagcdn.com/w160/${(iso2 || sectionCode.substring(0, 2)).toLowerCase()}.png`;
}

export function CollectionOverviewClient({ userCollectionId }: { userCollectionId: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();

  const token = typeof window === 'undefined' ? null : window.localStorage.getItem(accessTokenKey);

  const detail = usePersonalCollection(userCollectionId, locale, token);
  const progress = usePersonalCollectionProgress(userCollectionId, locale, token);

  if (!token && typeof window !== 'undefined') {
    router.replace('/login');
    return null;
  }

  if (detail.isError || progress.isError) {
    return <StateMessage message={t('myCollections.loadError')} />;
  }

  const sections = progress.data?.sections || [];
  const totalStickers = progress.data?.totalStickers || 0;
  const collectedStickers = progress.data?.ownedUnique || 0;
  const duplicateStickers = progress.data?.duplicates || 0;
  const missingStickers = progress.data?.missing || 0;
  const globalPercentage = progress.data?.completionPercentage || 0;
  
  const specialSections = sections.filter((s) => s.type !== 'NATIONAL_TEAM');
  const nationalTeams = sections.filter((s) => s.type === 'NATIONAL_TEAM');

  const chunkedTeams = [];
  for (let i = 0; i < nationalTeams.length; i += 4) {
    chunkedTeams.push(nationalTeams.slice(i, i + 4));
  }

  const [instantFilter, setInstantFilter] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const isFiltering = instantFilter.length > 0;
  const filteredSections = isFiltering ? sections.filter(s => s.code.startsWith(instantFilter)) : [];

  return (
    <div className="min-h-screen lg:pl-[76px]">
      {progress.data && (
        <CollectorSidebar 
          progress={progress.data} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      )}
      <div className="mx-auto max-w-7xl px-5 py-10">
      <header className="mb-8">
        <Link className="text-sm font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400" href="/my-collections">
          {t('myCollections.back')}
        </Link>
        <h1 className="mt-4 text-4xl font-black text-slate-100 drop-shadow-md">
          {detail.data?.collection.name ?? t('common.loading')}
        </h1>
        {detail.data?.collection.description && (
          <p className="mt-3 max-w-3xl text-lg text-amber-100/70">
            {detail.data.collection.description}
          </p>
        )}
      </header>

      {progress.data && (
        <div className="mb-8 block lg:hidden overflow-hidden rounded-3xl border border-white/10 bg-[#121216]/95 shadow-xl">
          <div className="p-5">
            <div className="flex items-end justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Progresso global</p>
                <p className="mt-1 text-3xl font-black text-amber-500">{globalPercentage}%</p>
              </div>
              <p className="pb-1 text-sm font-semibold text-zinc-400">{collectedStickers}/{totalStickers}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500" style={{ width: `${Math.min(globalPercentage, 100)}%` }} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-white/[0.02]">
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Coladas</span>
              <span className="mt-1 text-base font-bold text-emerald-400">{collectedStickers}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Faltam</span>
              <span className="mt-1 text-base font-bold text-pink-500">{missingStickers}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Repetidas</span>
              <span className="mt-1 text-base font-bold text-violet-400">{duplicateStickers}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col gap-4 max-w-xl mx-auto lg:max-w-none lg:mx-0">
        {/* Row 1: Instant Filter */}
        <div className="w-full relative">
          <label htmlFor="globalSearch" className="sr-only">Filtrar por Sigla</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="text-xl text-amber-500">🛡️</span>
            </div>
            <input
              id="globalSearch"
              type="text"
              className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900/80 px-4 py-3 pl-12 text-base font-black tracking-[0.2em] text-amber-400 placeholder-zinc-600 outline-none transition focus:border-amber-500 focus:bg-zinc-900 shadow-inner uppercase"
              placeholder="PESQUISAR SELEÇÃO (EX: BRA)"
              value={instantFilter}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
                setInstantFilter(val);
              }}
            />
          </div>
        </div>

        {/* Row 2: Secondary Actions */}
        <div className="flex gap-3 justify-center lg:justify-start">
          <Link
            href={`/my-collections/${userCollectionId}/missing`}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-amber-900/30 px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-300 transition-colors hover:border-amber-700/50 hover:text-amber-500"
          >
            <span className="text-sm">🔍</span>
            <span className="tracking-wider uppercase">{t('myCollections.viewMissing')}</span>
          </Link>
          <Link
            href={`/my-collections/${userCollectionId}/repeated`}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-amber-900/30 px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-300 transition-colors hover:border-amber-700/50 hover:text-amber-500"
          >
            <span className="text-sm">🔄</span>
            <span className="tracking-wider uppercase">{t('myCollections.viewDuplicates')}</span>
          </Link>
        </div>
      </div>

      {isFiltering ? (
        <section className="mb-8 border-t border-amber-900/50 pt-8 min-h-[40vh]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500/80 mb-4">
            Resultado da Busca: {instantFilter}
          </h2>
          {filteredSections.length > 0 ? (
            <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
              {filteredSections.map(section => (
                <CompactSectionCard key={section.sectionId} section={section} userCollectionId={userCollectionId} />
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 font-bold italic">Nenhuma seleção encontrada com essa sigla.</div>
          )}
        </section>
      ) : (
        <>
          <section className="mb-8">
            <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
              {/* FWC / Especiais */}
              <div className="flex flex-col gap-2">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
                  Especiais / FWC History
                </h2>
                <div className="flex flex-col gap-1.5">
                  {specialSections.map((section) => (
                    <CompactSectionCard key={section.sectionId} section={section} userCollectionId={userCollectionId} />
                  ))}
                  {specialSections.length === 0 && (
                    <div className="text-sm text-zinc-500 italic">Nenhuma seção especial encontrada.</div>
                  )}
                </div>
              </div>
              {/* Coca-Cola Placeholder */}
              <div className="flex flex-col gap-2">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
                  Coca-Cola & Extra Series
                </h2>
                <div className="flex flex-col gap-1.5">
                  <div className="group relative flex items-center h-10 w-full overflow-hidden rounded bg-zinc-900/20 border border-dashed border-zinc-800/50 opacity-50 cursor-not-allowed">
                    <div className="flex w-12 shrink-0 items-center justify-center h-full border-r border-dashed border-zinc-800/50 bg-zinc-950/20">
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500">C1-C8</span>
                    </div>
                    <div className="flex w-10 shrink-0 items-center justify-center h-full border-r border-dashed border-zinc-800/50 bg-zinc-900/50 p-1">
                      <span className="text-sm grayscale opacity-70">🥤</span>
                    </div>
                    <div className="flex-1 px-3">
                      <span className="text-xs sm:text-sm font-bold text-zinc-400">Coca-Cola Team Believers</span>
                    </div>
                    <div className="flex shrink-0 items-center justify-end px-3 h-full">
                      <span className="text-[9px] font-black uppercase text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">Em breve</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mb-12 border-t border-zinc-800/50 pt-8 grid gap-x-8 gap-y-8 lg:grid-cols-2">
            {chunkedTeams.map((chunk, index) => (
              <div key={`group-${index}`} className="flex flex-col gap-2">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
                  Grupo {String.fromCharCode(65 + index)}
                </h2>
                <div className="flex flex-col gap-1.5">
                  {chunk.map((section) => (
                    <CompactSectionCard key={section.sectionId} section={section} userCollectionId={userCollectionId} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

function CompactSectionCard({ section, userCollectionId }: { section: any; userCollectionId: string }) {
  const isNationalTeam = section.type === 'NATIONAL_TEAM';
  
  return (
    <Link
      href={`/my-collections/${userCollectionId}/sections/${section.sectionId}`}
      className="group relative flex items-center h-10 w-full overflow-hidden rounded bg-zinc-900/40 border border-zinc-800/50 transition-colors hover:bg-zinc-800 hover:border-amber-700/50"
    >
      {/* Code Strip */}
      <div className="flex w-10 sm:w-12 shrink-0 items-center justify-center h-full border-r border-zinc-800/50 bg-zinc-950/50">
        <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-zinc-400 group-hover:text-amber-500/70 transition-colors">
          {section.code}
        </span>
      </div>
      
      {/* Flag/Icon */}
      <div className="flex w-10 sm:w-12 shrink-0 items-center justify-center h-full border-r border-zinc-800/50 bg-zinc-900 p-1">
        {isNationalTeam ? (
          <img 
            src={getFlagUrl(section.code, section.countryIso2)} 
            className="h-full w-full object-contain" 
            alt={section.name} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
          />
        ) : (
          <span className="text-[10px] font-bold text-amber-500/50 group-hover:text-amber-400 transition-colors">
            {section.code.substring(0, 3)}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 px-3 min-w-0">
        <span className="block truncate text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
          {section.name}
        </span>
      </div>

      {/* Progress Stats */}
      <div className="flex w-16 sm:w-20 shrink-0 flex-col items-end justify-center px-2 sm:px-3 h-full bg-zinc-950/30">
        <span className="text-xs sm:text-sm font-black text-amber-500 drop-shadow-sm">
          {section.percentage}%
        </span>
      </div>

      {/* Progress Bar (Bottom Line) */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-zinc-800/50">
        <div 
          className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500" 
          style={{ width: `${section.percentage}%` }} 
        />
      </div>
    </Link>
  );
}


function StateMessage({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-lg font-bold text-slate-500">
      {message}
    </div>
  );
}
