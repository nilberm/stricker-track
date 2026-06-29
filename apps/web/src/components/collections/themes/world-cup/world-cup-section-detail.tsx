'use client';

import { useState, Fragment, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '../../../../i18n/navigation';
import { accessTokenKey } from '../../../../lib/auth';
import type { Locale } from '../../../../i18n/config';
import { usePersonalCollectionProgress, usePersonalStickers } from '../../../../hooks/use-personal-collection';
import { listPersonalStickers } from '../../../../lib/personal-collections';
import { Search } from 'lucide-react';
import { WorldCupStickerCard } from './world-cup-sticker-card';

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

import type { Variants } from 'framer-motion';

const leftPageVariants: Variants = {
  enter: (direction: number) => ({ rotateY: direction > 0 ? 90 : 0, zIndex: direction > 0 ? 10 : 1 }),
  center: (direction: number) => ({ rotateY: 0, zIndex: direction > 0 ? 10 : 1, transition: { duration: direction > 0 ? 0.3 : 0.6, delay: direction > 0 ? 0.3 : 0, ease: direction > 0 ? 'easeOut' : 'linear' } }),
  exit: (direction: number) => ({ rotateY: direction > 0 ? 0 : 90, zIndex: direction > 0 ? 1 : 10, transition: { duration: direction > 0 ? 0.6 : 0.3, ease: direction > 0 ? 'linear' : 'easeIn' } }),
};

const rightPageVariants: Variants = {
  enter: (direction: number) => ({ rotateY: direction < 0 ? -90 : 0, zIndex: direction < 0 ? 10 : 1 }),
  center: (direction: number) => ({ rotateY: 0, zIndex: direction < 0 ? 10 : 1, transition: { duration: direction < 0 ? 0.3 : 0.6, delay: direction < 0 ? 0.3 : 0, ease: direction < 0 ? 'easeOut' : 'linear' } }),
  exit: (direction: number) => ({ rotateY: direction < 0 ? 0 : -90, zIndex: direction < 0 ? 1 : 10, transition: { duration: direction < 0 ? 0.6 : 0.3, ease: direction < 0 ? 'linear' : 'easeIn' } }),
};

function getFlagUrl(sectionCode: string, iso2: string | null, width: 40 | 160 = 160) {
  if (sectionCode === 'ENG') return '/flags/england.png';
  if (sectionCode === 'SCO') return '/flags/scotland.png';
  return `https://flagcdn.com/w${width}/${(iso2 || sectionCode.substring(0, 2)).toLowerCase()}.png`;
}

export function WorldCupSectionDetail({
  userCollectionId,
  sectionId: initialSectionId,
}: {
  userCollectionId: string;
  sectionId: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const [activeSectionId, setActiveSectionId] = useState(initialSectionId);

  useEffect(() => {
    setActiveSectionId(initialSectionId);
  }, [initialSectionId]);

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
    sectionId: activeSectionId,
    limit: '1000',
  });
  if (search) queryParams.set('search', search);
  if (status !== 'all') queryParams.set('status', status);

  const stickers = usePersonalStickers(userCollectionId, token, queryParams.toString());

  const currentIndex = progress.data?.sections?.findIndex((s) => s.sectionId === activeSectionId) ?? -1;
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

  useEffect(() => {
    if (typeof window !== 'undefined' && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  if (progress.isError || stickers.isError) {
    return (
      <div className="border-4 border-dashed border-[#c6a760] bg-[#1a472a] p-12 text-center text-lg font-black text-[#c6a760] uppercase font-teko">
        {t('myCollections.loadError')}
      </div>
    );
  }

  const section = progress.data?.sections?.find((s) => s.sectionId === activeSectionId);
  const isNationalTeam = section?.type === 'NATIONAL_TEAM';

  const stickersData = stickers.data?.data ?? [];
  const half = isNationalTeam ? 10 : Math.ceil(stickersData.length / 2);
  const leftStickers = stickersData.slice(0, half);
  const rightStickers = stickersData.slice(half);

  const nationalTeams = progress.data?.sections?.filter((s) => s.type === 'NATIONAL_TEAM') ?? [];
  const teamIndex = nationalTeams.findIndex((s) => s.sectionId === activeSectionId);
  const groupIndex = Math.floor(teamIndex / 4);
  const groupTeams =
    teamIndex !== -1
      ? nationalTeams.slice(groupIndex * 4, groupIndex * 4 + 4)
      : [];

  const filteredSections = instantFilter.length > 0 
    ? progress.data?.sections?.filter(s => s.code.toUpperCase().startsWith(instantFilter.toUpperCase()) || s.name.toUpperCase().startsWith(instantFilter.toUpperCase())) ?? []
    : [];

  const handleNavigate = (newSectionId: string) => {
    setActiveSectionId(newSectionId);
    window.history.pushState(null, '', `/${locale}/my-collections/${userCollectionId}/sections/${newSectionId}`);
  };

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: 'body { background-color: #1a472a !important; }' }} />
    <div className="w-full flex flex-col relative bg-[#1a472a] pb-10" style={{ perspective: '2000px' }}>
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>



      <div className="w-full px-2 sm:px-4 lg:px-8 xl:px-24 flex flex-col flex-1 items-center justify-start pt-6 lg:pt-8 relative z-10 mx-auto max-w-[1600px]">
        {/* Header: Back Button, Search Bar & Page Number */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 lg:gap-0 mb-6 z-50 w-full">
          <div className="flex-1 flex justify-start">
          <Link 
            href={`/my-collections/${userCollectionId}`}
            className="inline-flex items-center gap-2 border-2 border-zinc-900 bg-[#c6a760] px-3 py-1.5 xl:px-4 xl:py-2 text-[10px] xl:text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#0d2a18] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0d2a18]"
          >
            ← {t('common.backCollection')}
          </Link>
        </div>
        
        {/* Central Search Bar */}
        <div className="flex-1 flex justify-center relative" ref={searchRef}>
          <div className="relative group w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900" strokeWidth={3} size={20} />
            <input
              type="text"
              placeholder="Pesquisar seleção..."
              value={instantFilter}
              onChange={(e) => {
                setInstantFilter(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full border-2 border-zinc-900 bg-[#e0c279] px-3 py-2 pl-10 xl:px-4 xl:py-3 xl:pl-12 text-xs xl:text-sm font-black uppercase tracking-[0.2em] text-zinc-900 placeholder:text-zinc-700 focus:bg-[#f2d99d] focus:outline-none shadow-[4px_4px_0px_#0d2a18]"
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
                className="absolute top-full mt-3 w-full max-w-sm bg-white border-2 border-zinc-900 shadow-[8px_8px_0px_#0d2a18] overflow-hidden"
              >
                {filteredSections.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto flex flex-col">
                    {filteredSections.map(s => (
                      <Link 
                        key={s.sectionId}
                        href={`/my-collections/${userCollectionId}/sections/${s.sectionId}`}
                        onClick={() => {
                          setInstantFilter('');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 hover:bg-zinc-100 transition-colors group last:border-b-0"
                      >
                        <img 
                          src={getFlagUrl(s.code, s.countryIso2 ?? null, 40)} 
                          className="w-8 h-auto border border-zinc-900" 
                          alt={s.code}
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-black text-zinc-900 uppercase">{s.code}</span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs font-black text-zinc-500 uppercase tracking-widest">Nenhuma seleção encontrada.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 hidden lg:flex justify-end">
          {section?.code && FEDERATION_PAGES[section.code] && (
            <div className="inline-flex items-center gap-2 xl:gap-3 border-2 border-[#c6a760] bg-[#1a472a] px-3 py-1.5 xl:px-4 xl:py-2 text-xs xl:text-sm font-black text-[#c6a760] shadow-[4px_4px_0px_#0d2a18]">
              <span className="text-[10px] xl:text-xs uppercase tracking-widest text-[#e0c279]">Páginas</span>
              <span className="border-l-2 border-[#c6a760] pl-2 xl:pl-3 ml-1">{FEDERATION_PAGES[section.code]} - {FEDERATION_PAGES[section.code] + 1}</span>
            </div>
          )}
        </div>
      </div>
      
      {stickers.isPending ? (
          <div className="text-[#c6a760] font-teko text-2xl tracking-widest uppercase">{t('common.loading')}</div>
        ) : stickersData.length ? (
          <div className="grid w-full relative" style={{ gridTemplateAreas: '"stack"', perspective: '2000px' }}>
            {prevSectionId && (
              <button
                onClick={() => handleNavigate(prevSectionId)}
                className="hidden lg:flex absolute -left-2 sm:-left-4 lg:-left-8 xl:-left-20 top-1/2 z-50 h-10 w-10 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center border-2 border-zinc-900 bg-[#c6a760] text-zinc-900 shadow-[4px_4px_0px_#0d2a18] transition-all hover:-translate-x-0.5 hover:-translate-y-1/2 hover:shadow-[6px_6px_0px_#0d2a18] lg:h-12 lg:w-12 xl:h-16 xl:w-16 hover:bg-[#e0c279]"
              >
                <svg className="h-6 w-6 lg:h-6 lg:w-6 xl:h-8 xl:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
              </button>
            )}
            {nextSectionId && (
              <button
                onClick={() => handleNavigate(nextSectionId)}
                className="hidden lg:flex absolute -right-2 sm:-right-4 lg:-right-8 xl:-right-20 top-1/2 z-50 h-10 w-10 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center border-2 border-zinc-900 bg-[#c6a760] text-zinc-900 shadow-[4px_4px_0px_#0d2a18] transition-all hover:-translate-x-0.5 hover:-translate-y-1/2 hover:shadow-[6px_6px_0px_#0d2a18] lg:h-12 lg:w-12 xl:h-16 xl:w-16 hover:bg-[#e0c279]"
              >
                <svg className="h-6 w-6 lg:h-6 lg:w-6 xl:h-8 xl:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
              </button>
            )}
            <AnimatePresence mode="sync" custom={direction}>
              <motion.div
                key={activeSectionId}
                custom={direction}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid w-full gap-0 lg:grid-cols-2"
                style={{ gridArea: 'stack' }}
              >
                {/* LEFT PAGE */}
                <motion.div
                  custom={direction}
                  variants={leftPageVariants}
                  style={{ transformOrigin: 'right center', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  className="w-full h-full relative"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 content-start gap-2 bg-[#f4f0e6] p-4 border-y-[6px] border-l-[6px] border-[#c6a760] relative shadow-2xl h-full z-10">
                    {/* Book spine shadow effect (Inside) */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#d5ceb6]/80 to-transparent pointer-events-none z-10"></div>
                    {/* Page edge effect (Outside) */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-10 border-l border-white/40"></div>

                    {isNationalTeam && (
                      <div className="col-span-2 flex lg:aspect-[3/2] flex-col justify-start lg:justify-between overflow-hidden p-2 sm:p-4 lg:p-5 relative z-20 @container">
                        <div>
                          <span className="block text-5xl sm:text-6xl md:text-8xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black text-[#1a472a] leading-[0.8] font-truly uppercase tracking-normal">WE ARE</span>
                          <span 
                            className="block font-black uppercase text-[#f59e0b] leading-[0.8] mt-2 sm:mt-3 font-truly"
                            style={{ 
                              fontSize: `clamp(3rem, ${Math.min(45, 180 / (section?.name?.length || 1))}cqw, 9rem)`,
                              letterSpacing: '2pt'
                            }}
                          >
                            {section?.name}
                          </span>
                        </div>
                        <div className="mt-4 lg:mt-auto flex items-center gap-2 sm:gap-3">
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
                          <span 
                            className="font-black uppercase tracking-widest text-[#1a472a] leading-tight"
                            style={{ 
                              fontSize: `clamp(8px, ${Math.max(2.5, Math.min(5, 120 / (FEDERATION_NAMES[section?.code || '']?.length || 20)))}cqw, 14px)`
                            }}
                          >
                            {FEDERATION_NAMES[section?.code || ''] || "National Football Association"}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* MOBILE NAV (PREV/NEXT) TOP */}
                    <div className="col-span-2 flex lg:hidden justify-between py-2 relative z-20">
                      {prevSectionId && (
                        <button
                          onClick={() => handleNavigate(prevSectionId)}
                          className="flex h-12 w-24 items-center justify-center border-2 border-zinc-900 bg-[#c6a760] text-zinc-900 shadow-[4px_4px_0px_#0d2a18]"
                        >
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
                        </button>
                      )}
                      {nextSectionId && (
                        <button
                          onClick={() => handleNavigate(nextSectionId)}
                          className="flex h-12 w-24 items-center justify-center border-2 border-zinc-900 bg-[#c6a760] text-zinc-900 shadow-[4px_4px_0px_#0d2a18]"
                        >
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
                        </button>
                      )}
                    </div>
                    {leftStickers.map((sticker) => (
                      <WorldCupStickerCard
                        key={sticker.id}
                        sticker={sticker}
                        token={token!}
                        userCollectionId={userCollectionId}
                      />
                    ))}
                    
                    {/* Left Page Number */}
                    {section?.code && FEDERATION_PAGES[section.code] && (
                       <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-[#c6a760] font-teko text-lg sm:text-xl opacity-80 z-30">
                          {FEDERATION_PAGES[section.code]}
                       </div>
                    )}
                  </div>
                </motion.div>

                {/* RIGHT PAGE */}
                <motion.div
                  custom={direction}
                  variants={rightPageVariants}
                  style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  className="w-full h-full relative"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 content-start gap-2 bg-[#f4f0e6] p-4 border-y-[6px] border-r-[6px] border-[#c6a760] relative shadow-2xl h-full z-10">
                    {/* Book spine shadow effect (Inside) */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#d5ceb6]/80 to-transparent pointer-events-none z-10"></div>
                    {/* Page edge effect (Outside) */}
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/5 to-transparent pointer-events-none z-10 border-r border-white/40"></div>
                    
                    {rightStickers.map((sticker, index) => (
                      <Fragment key={sticker.id}>
                        {isNationalTeam && index === 7 && (
                          <div className="col-span-1 flex aspect-[3/4] flex-col items-center justify-center p-2 text-center relative z-20">
                            <span className="mb-3 text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-teko font-black uppercase tracking-widest text-[#f59e0b] whitespace-nowrap">
                              Group {teamIndex !== -1 ? String.fromCharCode(65 + groupIndex) : 'Info'}
                            </span>
                            <div className="grid w-full grid-cols-2 gap-2 mt-1">
                              {groupTeams.map((team) => (
                                <div key={team.sectionId} className="flex aspect-[3/2] w-full bg-black overflow-hidden shadow-sm rounded-tr-[12px] sm:rounded-tr-[16px] border border-black/10">
                                  {/* Left Strip */}
                                  <div className="flex w-4 sm:w-5 shrink-0 items-center justify-center bg-black">
                                    <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-widest text-white/90" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                      {team.code}
                                    </span>
                                  </div>
                                  {/* Right part (Flag) */}
                                  <div className="flex-1 relative bg-black">
                                    <img
                                      src={getFlagUrl(team.code, team.countryIso2 ?? null, 160)}
                                      alt={team.name}
                                      className="absolute inset-0 w-full h-full object-contain object-center bg-black p-0.5"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-zinc-800"><span class="text-[10px] text-white/50 font-black">${team.code}</span></div>`;
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                              {groupTeams.length === 0 && (
                                <div className="col-span-2 grid w-full grid-cols-2 gap-2 opacity-50 px-2">
                                  <div className="aspect-[2/1] w-full bg-black rounded-tr-[12px]"></div>
                                  <div className="aspect-[2/1] w-full bg-black rounded-tr-[12px]"></div>
                                  <div className="aspect-[2/1] w-full bg-black rounded-tr-[12px]"></div>
                                  <div className="aspect-[2/1] w-full bg-black rounded-tr-[12px]"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <WorldCupStickerCard
                          sticker={sticker}
                          token={token!}
                          userCollectionId={userCollectionId}
                        />
                      </Fragment>
                    ))}

                    {/* Right Page Number */}
                    {section?.code && FEDERATION_PAGES[section.code] && (
                       <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 text-[#c6a760] font-teko text-lg sm:text-xl opacity-80 z-30">
                          {FEDERATION_PAGES[section.code] + 1}
                       </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="border-4 border-dashed border-[#c6a760] bg-[#1a472a] p-12 text-center text-lg font-black text-[#c6a760] uppercase font-teko">
            {t('myCollections.noStickers')}
          </div>
        )}

        {/* MOBILE NAV (PREV/NEXT) BOTTOM */}
        <div className="w-full flex lg:hidden justify-between mt-6 z-50">
          {prevSectionId && (
            <button
              onClick={() => handleNavigate(prevSectionId)}
              className="flex h-12 w-24 items-center justify-center border-2 border-zinc-900 bg-[#c6a760] text-zinc-900 shadow-[4px_4px_0px_#0d2a18]"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}
          {nextSectionId && (
            <button
              onClick={() => handleNavigate(nextSectionId)}
              className="flex h-12 w-24 items-center justify-center border-2 border-zinc-900 bg-[#c6a760] text-zinc-900 shadow-[4px_4px_0px_#0d2a18]"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
