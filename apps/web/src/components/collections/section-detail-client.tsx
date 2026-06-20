'use client';

import { useState, Fragment, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '../../i18n/navigation';
import { accessTokenKey } from '../../lib/auth';
import type { Locale } from '../../i18n/config';
import { usePersonalCollectionProgress, usePersonalStickers } from '../../hooks/use-personal-collection';
import { PersonalStickerCard } from './cards/personal-sticker-card';
import { listPersonalStickers } from '../../lib/personal-collections';
import type { PersonalStickerPage } from '../../lib/personal-collections';
import { Search } from 'lucide-react';

const FEDERATION_NAMES: Record<string, string> = {
  MEX: "Federación Mexicana de Fútbol",
  RSA: "South African Football Association",
  KOR: "Korea Football Association",
  CZE: "Fotbalová asociace České republiky",
  CAN: "Canadian Soccer Association",
  BIH: "Nogometni/Fudbalski savez Bosne i Hercegovine",
  QAT: "Qatar Football Association",
  SUI: "Association Suisse de Football",
  BRA: "Confederação Brasileira de Futebol",
  MAR: "Fédération Royale Marocaine de Football",
  HAI: "Fédération Haïtienne de Football",
  SCO: "Scottish Football Association",
  USA: "United States Soccer Federation",
  PAR: "Asociación Paraguaya de Fútbol",
  AUS: "Football Australia",
  TUR: "Türkiye Futbol Federasyonu",
  GER: "Deutscher Fußball-Bund",
  CUW: "Federashon Futbòl Kòrsou",
  CIV: "Fédération Ivoirienne de Football",
  ECU: "Federación Ecuatoriana de Fútbol",
  NED: "Koninklijke Nederlandse Voetbalbond",
  JPN: "Japan Football Association",
  SWE: "Svenska Fotbollförbundet",
  TUN: "Fédération Tunisienne de Football",
  BEL: "Royal Belgian Football Association",
  EGY: "Egyptian Football Association",
  IRN: "Football Federation Islamic Republic of Iran",
  NZL: "New Zealand Football",
  ESP: "Real Federación Española de Fútbol",
  CPV: "Federação Cabo-verdiana de Futebol",
  KSA: "Saudi Arabian Football Federation",
  URU: "Asociación Uruguaya de Fútbol",
  FRA: "Fédération Française de Football",
  SEN: "Fédération Sénégalaise de Football",
  IRQ: "Iraq Football Association",
  NOR: "Norges Fotballforbund",
  ARG: "Asociación del Fútbol Argentino",
  ALG: "Fédération Algérienne de Football",
  AUT: "Österreichischer Fußball-Bund",
  JOR: "Jordan Football Association",
  POR: "Federação Portuguesa de Futebol",
  COD: "Fédération Congolaise de Football-Association",
  UZB: "Uzbekistan Football Association",
  COL: "Federación Colombiana de Fútbol",
  ENG: "The Football Association",
  CRO: "Hrvatski nogometni savez",
  GHA: "Ghana Football Association",
  PAN: "Federación Panameña de Fútbol"
};

const FEDERATION_PAGES: Record<string, number> = {
  MEX: 8, RSA: 10, KOR: 12, CZE: 14,
  CAN: 16, BIH: 18, QAT: 20, SUI: 22,
  BRA: 24, MAR: 26, HAI: 28, SCO: 30,
  USA: 32, PAR: 34, AUS: 36, TUR: 38,
  GER: 40, CUW: 42, CIV: 44, ECU: 46,
  NED: 48, JPN: 50, SWE: 52, TUN: 54,
  BEL: 58, EGY: 60, IRN: 62, NZL: 64,
  ESP: 66, CPV: 68, KSA: 70, URU: 72,
  FRA: 74, SEN: 76, IRQ: 78, NOR: 80,
  ARG: 82, ALG: 84, AUT: 86, JOR: 88,
  POR: 90, COD: 92, UZB: 94, COL: 96,
  ENG: 98, CRO: 100, GHA: 102, PAN: 104
};

const pageVariants = {
  enter: (direction: number) => ({
    rotateY: direction > 0 ? 180 : -180,
    opacity: 0,
    zIndex: 0,
  }),
  center: {
    zIndex: 1,
    rotateY: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    rotateY: direction > 0 ? -180 : 180,
    opacity: 0,
  }),
};

const stickerTypesOrder = [
  'BADGE',
  'TEAM',
  'PLAYER',
  'STADIUM',
  'TROPHY',
  'MASCOT',
  'SPECIAL',
  'OTHER',
];

function getFlagUrl(sectionCode: string, iso2: string | null, width: 40 | 160 = 160) {
  if (sectionCode === 'ENG') return '/flags/england.png';
  if (sectionCode === 'SCO') return '/flags/scotland.png';
  return `https://flagcdn.com/w${width}/${(iso2 || sectionCode.substring(0, 2)).toLowerCase()}.png`;
}

export function SectionDetailClient({
  userCollectionId,
  sectionId,
}: {
  userCollectionId: string;
  sectionId: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const [instantFilter, setInstantFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const token = typeof window === 'undefined' ? null : window.localStorage.getItem(accessTokenKey);

  const progress = usePersonalCollectionProgress(userCollectionId, locale, token);

  const queryParams = new URLSearchParams({
    locale,
    sectionId,
    limit: '1000', // Fetch practically all stickers of this section to group them client-side
  });
  if (search) queryParams.set('search', search);
  if (status !== 'all') queryParams.set('status', status);

  const stickers = usePersonalStickers(userCollectionId, token, queryParams.toString());

  const currentIndex = progress.data?.sections?.findIndex((s) => s.sectionId === sectionId) ?? -1;
  const prevSectionId = currentIndex > 0 ? progress.data?.sections?.[currentIndex - 1]?.sectionId : null;
  const nextSectionId =
    currentIndex !== -1 && currentIndex < (progress.data?.sections?.length ?? 0) - 1
      ? progress.data?.sections?.[currentIndex + 1]?.sectionId
      : null;

  const [tuple, setTuple] = useState([currentIndex, 0]);
  if (currentIndex !== -1 && tuple[0] !== currentIndex) {
    setTuple([currentIndex, currentIndex > tuple[0] ? 1 : -1]);
  }
  const direction = tuple[1];

  const queryClient = useQueryClient();

  useEffect(() => {
    if (token) {
      if (prevSectionId) {
        const qs = new URLSearchParams({ locale, sectionId: prevSectionId, limit: '1000' }).toString();
        queryClient.prefetchQuery({
          queryKey: ['userCollectionStickers', userCollectionId, qs],
          queryFn: () => listPersonalStickers(token, userCollectionId, new URLSearchParams(qs)),
        });
      }
      if (nextSectionId) {
        const qs = new URLSearchParams({ locale, sectionId: nextSectionId, limit: '1000' }).toString();
        queryClient.prefetchQuery({
          queryKey: ['userCollectionStickers', userCollectionId, qs],
          queryFn: () => listPersonalStickers(token, userCollectionId, new URLSearchParams(qs)),
        });
      }
    }
  }, [prevSectionId, nextSectionId, locale, userCollectionId, token, queryClient]);

  if (!token && typeof window !== 'undefined') {
    router.replace('/login');
    return null;
  }

  if (progress.isError || stickers.isError) {
    return <StateMessage message={t('myCollections.loadError')} />;
  }

  const section = progress.data?.sections?.find((s) => s.sectionId === sectionId);
  const collectionName = progress.data ? 'StickerTrack' : t('common.loading'); 
  const isNationalTeam = section?.type === 'NATIONAL_TEAM';

  const stickersData = stickers.data?.data ?? [];
  const half = isNationalTeam ? 10 : Math.ceil(stickersData.length / 2);
  const leftStickers = stickersData.slice(0, half);
  const rightStickers = stickersData.slice(half);

  const nationalTeams = progress.data?.sections?.filter((s) => s.type === 'NATIONAL_TEAM') ?? [];
  const teamIndex = nationalTeams.findIndex((s) => s.sectionId === sectionId);
  const groupIndex = Math.floor(teamIndex / 4);
  const groupTeams =
    teamIndex !== -1
      ? nationalTeams.slice(groupIndex * 4, groupIndex * 4 + 4)
      : [];

  const filteredSections = instantFilter.length > 0 
    ? progress.data?.sections?.filter(s => s.code.toUpperCase().startsWith(instantFilter.toUpperCase()) || s.name.toUpperCase().startsWith(instantFilter.toUpperCase())) ?? []
    : [];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:flex lg:min-h-[calc(100vh-100px)] lg:items-center lg:justify-center" style={{ perspective: '2000px' }}>
      {prevSectionId && (
        <Link
          href={`/my-collections/${userCollectionId}/sections/${prevSectionId}`}
          className="fixed left-2 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-amber-500 shadow-lg transition-transform hover:scale-110 hover:bg-zinc-800 lg:left-8 lg:h-16 lg:w-16"
        >
          <svg className="h-6 w-6 lg:h-8 lg:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
        </Link>
      )}
      {nextSectionId && (
        <Link
          href={`/my-collections/${userCollectionId}/sections/${nextSectionId}`}
          className="fixed right-2 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-amber-500 shadow-lg transition-transform hover:scale-110 hover:bg-zinc-800 lg:right-8 lg:h-16 lg:w-16"
        >
          <svg className="h-6 w-6 lg:h-8 lg:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
        </Link>
      )}

      {/* Header and tools (Visible on mobile, absolute top on desktop if needed, or hidden if taking too much space) */}
      <div className="mb-6 lg:hidden">
        <nav className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-500">
          <Link className="text-amber-500 hover:underline" href={`/my-collections/${userCollectionId}`}>
            ← {t('common.backCollection')}
          </Link>
        </nav>
        <header className="mb-6 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-500 drop-shadow-md">
              {section?.name ?? t('common.loading')}
            </h1>
            <p className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
              {section && t(`sectionTypes.${section.type}`)}
            </p>
          </div>
          {section && (
            <div className="flex items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 shadow-inner">
              <span className="font-black text-amber-500 text-lg">{section.percentage}%</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 shadow-inner">
                <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${section.percentage}%` }} />
              </div>
            </div>
          )}
        </header>
        <div className="flex flex-col gap-2">
          <input
            type="search"
            placeholder={t('catalog.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="w-full lg:px-24 flex flex-col">
        {/* Desktop Header: Back Button, Search Bar & Page Number */}
        <div className="hidden lg:flex items-center justify-between mb-6 z-50">
          <div className="flex-1">
            <Link 
              href={`/my-collections/${userCollectionId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-sm font-bold text-amber-500 shadow-lg transition-transform hover:bg-zinc-800"
            >
              ← {t('common.backCollection')}
            </Link>
          </div>
          
          {/* Central Search Bar */}
          <div className="flex-1 flex justify-center relative" ref={searchRef}>
            <div className="relative group w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Pesquisar seleção..."
                value={instantFilter}
                onChange={(e) => {
                  setInstantFilter(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full bg-zinc-900/90 border border-zinc-700 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-amber-500 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 uppercase tracking-wider shadow-lg transition-all"
              />
            </div>
            
            {/* Dropdown de sugestões */}
            <AnimatePresence>
              {isDropdownOpen && instantFilter.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
                >
                  {filteredSections.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto p-1 flex flex-col">
                      {filteredSections.map(s => (
                        <Link 
                          key={s.sectionId}
                          href={`/my-collections/${userCollectionId}/sections/${s.sectionId}`}
                          onClick={() => {
                            setInstantFilter('');
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors group"
                        >
                          <img 
                            src={getFlagUrl(s.code, s.countryIso2, 40)} 
                            className="w-6 h-auto rounded-sm opacity-80 group-hover:opacity-100" 
                            alt={s.code}
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-black text-amber-500">{s.code}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{s.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">Nenhuma seleção encontrada.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 flex justify-end">
            {section?.code && FEDERATION_PAGES[section.code] && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-sm font-bold text-zinc-400 shadow-lg">
                <span className="text-xs uppercase tracking-widest text-zinc-500">Páginas</span>
                <span className="text-amber-500">{FEDERATION_PAGES[section.code]} - {FEDERATION_PAGES[section.code] + 1}</span>
              </div>
            )}
          </div>
        </div>

        {stickers.isPending ? (
          <StateMessage message={t('common.loading')} />
        ) : stickersData.length ? (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={sectionId}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="grid w-full gap-8 lg:grid-cols-2"
              style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
            >
              {/* LEFT PAGE */}
              <div className="grid grid-cols-2 content-start gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                {isNationalTeam && (
                  <div className="col-span-2 flex aspect-[3/2] flex-col justify-between overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-3 sm:p-4 shadow-inner lg:p-5">
                    <div>
                      <span className="block text-lg font-black text-zinc-600 sm:text-xl lg:text-2xl leading-none">WE ARE</span>
                      <span 
                        className={`block font-black uppercase tracking-tighter text-amber-500 drop-shadow-md leading-none mt-1 ${
                          (section?.name?.length || 0) > 14 
                            ? 'text-lg sm:text-xl lg:text-2xl' 
                            : (section?.name?.length || 0) >= 8 
                              ? 'text-xl sm:text-2xl lg:text-3xl' 
                              : 'text-2xl sm:text-3xl lg:text-4xl'
                        }`}
                      >
                        {section?.name}
                      </span>
                    </div>
                    <div className="mt-2 sm:mt-auto flex items-center gap-2 sm:gap-3">
                      { (section?.countryIso2 || section?.code) && (
                        <img
                          src={section?.code === 'ENG' ? '/flags/england.png' : section?.code === 'SCO' ? '/flags/scotland.png' : `https://flagsapi.com/${(section?.countryIso2 || section?.code?.substring(0, 2))?.toUpperCase()}/flat/64.png`}
                          alt={section.name}
                          className="h-6 w-10 shrink-0 rounded object-cover drop-shadow-md sm:h-8 sm:w-12 lg:h-10 lg:w-14"
                          onError={(e) => {
                            if (e.currentTarget.src.includes('flagsapi.com')) {
                              e.currentTarget.src = getFlagUrl(section?.code || '', section?.countryIso2 || null, 160);
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 sm:text-xs lg:text-sm leading-tight line-clamp-2">
                        {FEDERATION_NAMES[section?.code || ''] || "National Football Association"}
                      </span>
                    </div>
                  </div>
                )}
                {leftStickers.map((sticker) => (
                  <PersonalStickerCard
                    key={sticker.id}
                    sticker={sticker}
                    token={token!}
                    userCollectionId={userCollectionId}
                  />
                ))}
              </div>

              {/* RIGHT PAGE */}
              <div className="grid grid-cols-2 content-start gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                {rightStickers.map((sticker, index) => (
                  <Fragment key={sticker.id}>
                    {isNationalTeam && index === 7 && (
                      <div className="col-span-1 flex aspect-[3/4] flex-col items-center justify-center p-2 text-center">
                        <span className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500 drop-shadow-sm">
                          Group {teamIndex !== -1 ? String.fromCharCode(65 + groupIndex) : 'Info'}
                        </span>
                        <div className="grid w-full grid-cols-2 gap-2">
                          {groupTeams.map((team) => (
                            <div key={team.sectionId} className="flex w-full rounded-md border border-zinc-800/50 shadow-sm overflow-hidden" style={{ borderTopRightRadius: '0.75rem', borderBottomRightRadius: '0.25rem' }}>
                              {/* Left Strip (Black) */}
                              <div className="flex w-5 shrink-0 items-center justify-center bg-zinc-950 border-r border-zinc-800/50">
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-200" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                  {team.code}
                                </span>
                              </div>
                              {/* Right part (Flag) */}
                              <div className="flex-1 bg-zinc-900 flex">
                                <img
                                  src={getFlagUrl(team.code, team.countryIso2, 160)}
                                  alt={team.name}
                                  className="w-full h-auto block object-cover opacity-90"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-zinc-800/50 py-2"><span class="text-[8px] text-zinc-600">${team.code}</span></div>`;
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                          {groupTeams.length === 0 && (
                            <div className="col-span-2 grid w-full grid-cols-2 gap-1 opacity-50 px-2">
                              <div className="aspect-[1.5/1] w-full rounded bg-zinc-800"></div>
                              <div className="aspect-[1.5/1] w-full rounded bg-zinc-800"></div>
                              <div className="aspect-[1.5/1] w-full rounded bg-zinc-800"></div>
                              <div className="aspect-[1.5/1] w-full rounded bg-zinc-800"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <PersonalStickerCard
                      sticker={sticker}
                      token={token!}
                      userCollectionId={userCollectionId}
                    />
                  </Fragment>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <StateMessage message={t('myCollections.noStickers')} />
        )}
      </div>
    </div>
  );
}

function StateMessage({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-amber-700/30 bg-zinc-900/50 p-12 text-center text-lg font-bold text-amber-100/70 shadow-inner">
      {message}
    </div>
  );
}
