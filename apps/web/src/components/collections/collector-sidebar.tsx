"use client";

import {
  Album,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Copy,
  Flag,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";

type CollectorSidebarProps = {
  isExpanded: boolean;
  setIsExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  progress: any;
};

import { useTranslations } from "next-intl";

export function CollectorSidebar({
  isExpanded,
  setIsExpanded,
  progress,
}: CollectorSidebarProps) {
  const t = useTranslations("collectorSidebar");
  if (!progress) return null;

  const totalStickers = progress.totalStickers || 0;
  const collectedStickers = progress.ownedUnique || 0;
  const duplicateStickers = progress.duplicates || 0;
  const missingStickers = progress.missing || 0;
  const globalPercentage = progress.completionPercentage || 0;

  const sections = progress.sections || [];
  
  // No Alvo (closest to 100 but not 100)
  const noAlvo = [...sections]
    .filter((s) => s.percentage < 100)
    .sort((a, b) => b.percentage - a.percentage)[0] || { name: t('none'), percentage: 0 };
    
  // Exploração (lowest percentage)
  const exploracao = [...sections]
    .sort((a, b) => a.percentage - b.percentage)[0] || { name: t('none'), percentage: 0 };
    
  // Glória (100%)
  const gloria = sections.filter((s: any) => s.percentage === 100).length;

  return (
    <aside
      className={`
        hidden lg:block
        fixed left-0 top-24 z-40
        transition-all duration-300 ease-in-out
        ${isExpanded ? "w-[310px]" : "w-[76px]"}
      `}
    >
      {/* Button floating OUTSIDE the hidden overflow */}
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-label={isExpanded ? t('collapse') : t('expand')}
        className="
          absolute -right-8 top-6 z-10
          flex h-10 w-8
          items-center justify-center
          border-y-4 border-r-4 border-zinc-900
          bg-emerald-300
          text-zinc-900
          transition-all
          hover:bg-emerald-400
          focus:outline-none
          shadow-[4px_4px_0px_#18181b]
        "
      >
        {isExpanded ? (
          <ChevronLeft size={24} strokeWidth={3} />
        ) : (
          <ChevronRight size={24} strokeWidth={3} />
        )}
      </button>

      <div
        className="
          relative
          h-[calc(100vh-112px)]
          overflow-hidden
          border-y-4 border-r-4 border-zinc-900
          bg-white
          shadow-[8px_8px_0px_#18181b]
        "
      >
        <div
          className={`
            h-full
            overflow-y-auto
            transition-all duration-300
            ${isExpanded ? "px-5 py-6" : "px-3 py-5"}
          `}
        >
          <SidebarHeader isExpanded={isExpanded} t={t} />

          <div className={isExpanded ? "mt-6" : "mt-5"}>
            <ProgressCard
              isExpanded={isExpanded}
              percentage={globalPercentage}
              collected={collectedStickers}
              total={totalStickers}
              t={t}
            />
          </div>

          <div
            className={`
              mt-5 border-t-4 border-zinc-900 pt-5
              ${isExpanded ? "space-y-3" : "space-y-2"}
            `}
          >
            <StatItem
              icon={<CircleCheck size={20} strokeWidth={3} />}
              label={t('collected')}
              value={collectedStickers}
              colorClass="text-emerald-500"
              isExpanded={isExpanded}
            />

            <StatItem
              icon={<Search size={20} strokeWidth={3} />}
              label={t('missing')}
              value={missingStickers}
              colorClass="text-red-500"
              isExpanded={isExpanded}
            />

            <StatItem
              icon={<Copy size={20} strokeWidth={3} />}
              label={t('duplicates')}
              value={duplicateStickers}
              colorClass="text-violet-500"
              isExpanded={isExpanded}
            />
          </div>

          <div className="mt-5 border-t-4 border-zinc-900 pt-5">
            <CurrentTeamCard
              isExpanded={isExpanded}
              teamName={noAlvo.name}
              percentage={noAlvo.percentage}
              t={t}
            />
          </div>

          <div
            className={`
              mt-5 border-t-4 border-zinc-900 pt-5
              ${isExpanded ? "space-y-4" : "space-y-2"}
            `}
          >
            <TeamRankingItem
              icon={<Trophy size={19} />}
              label={t('glory')}
              teamName={t('completedSections', { count: gloria })}
              percentage={gloria > 0 ? 100 : 0}
              colorClass="text-amber-400"
              isExpanded={isExpanded}
              hidePercentage={true}
            />

            <TeamRankingItem
              icon={<Flag size={19} />}
              label={t('exploration')}
              teamName={exploracao.name}
              percentage={exploracao.percentage}
              colorClass="text-zinc-400"
              isExpanded={isExpanded}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

type SidebarHeaderProps = {
  isExpanded: boolean;
  t: any;
};

function SidebarHeader({ isExpanded, t }: SidebarHeaderProps) {
  return (
    <div
      className={`
        flex items-center
        ${isExpanded ? "gap-3" : "justify-center"}
      `}
    >
      <div
        className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          border-2 border-zinc-900
          bg-amber-300
          text-zinc-900
          shadow-[2px_2px_0px_#18181b]
        "
      >
        <Album size={24} strokeWidth={3} />
      </div>

      {isExpanded && (
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {t('myCollections')}
          </p>

          <h2 className="truncate text-base font-black uppercase tracking-widest text-zinc-900">
            Pergaminho
          </h2>
        </div>
      )}
    </div>
  );
}

type ProgressCardProps = {
  isExpanded: boolean;
  percentage: number;
  collected: number;
  total: number;
  t: any;
};

function ProgressCard({
  isExpanded,
  percentage,
  collected,
  total,
  t
}: ProgressCardProps) {
  if (!isExpanded) {
    return (
      <div
        className="
          flex flex-col items-center
          border-2 border-zinc-900
          bg-zinc-100
          px-2 py-3
          shadow-[2px_2px_0px_#18181b]
        "
        title={`${t('globalProgress')}: ${percentage}%`}
      >
        <Sparkles size={20} strokeWidth={3} className="text-zinc-900" />

        <span className="mt-2 text-base font-black text-zinc-900">
          {percentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="border-4 border-zinc-900 bg-zinc-100 p-4 shadow-[4px_4px_0px_#18181b]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
            {t('globalProgress')}
          </p>

          <p className="mt-1 text-4xl font-black text-zinc-900">
            {percentage}%
          </p>
        </div>

        <p className="pb-1 text-xs font-black uppercase text-zinc-500">
          {collected}/{total}
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden border-2 border-zinc-900 bg-zinc-200">
        <div
          className="
            h-full
            bg-amber-400
            border-r-2 border-zinc-900
            transition-all duration-500
          "
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

type StatItemProps = {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  colorClass: string;
  isExpanded: boolean;
};

function StatItem({
  icon,
  label,
  value,
  colorClass,
  isExpanded,
}: StatItemProps) {
  if (!isExpanded) {
    return (
      <div
        title={`${label}: ${value}`}
        className="
          flex min-h-[58px] flex-col
          items-center justify-center
          border-2 border-zinc-900
          bg-zinc-100
          px-1 py-2
          transition-all
          hover:bg-zinc-200
          shadow-[2px_2px_0px_#18181b]
        "
      >
        <span className={colorClass}>{icon}</span>

        <span className="mt-1 text-xs font-black text-zinc-900">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div
      className="
        flex items-center justify-between gap-4
        border-2 border-zinc-900
        bg-zinc-100
        px-3 py-3
        transition-all
        hover:-translate-x-0.5 hover:-translate-y-0.5
        shadow-[4px_4px_0px_#18181b] hover:shadow-[6px_6px_0px_#18181b]
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={colorClass}>{icon}</span>

        <span className="truncate text-xs font-black uppercase tracking-widest text-zinc-900">
          {label}
        </span>
      </div>

      <strong className={`text-base font-black ${colorClass}`}>
        {value}
      </strong>
    </div>
  );
}

type CurrentTeamCardProps = {
  isExpanded: boolean;
  teamName: string;
  percentage: number;
  t: any;
};

function CurrentTeamCard({
  isExpanded,
  teamName,
  percentage,
  t
}: CurrentTeamCardProps) {
  if (!isExpanded) {
    return (
      <div
        title={`${teamName}: ${percentage}% completo`}
        className="
          flex flex-col items-center
          border-2 border-zinc-900
          bg-amber-300
          px-1 py-3
          shadow-[2px_2px_0px_#18181b]
        "
      >
        <Flag size={20} strokeWidth={3} className="text-zinc-900" />

        <span className="mt-1 text-xs font-black text-zinc-900">
          {percentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="border-4 border-zinc-900 bg-amber-300 p-4 shadow-[4px_4px_0px_#18181b]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-800">
        🎯 {t('onTarget')}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <strong className="truncate text-base font-black uppercase text-zinc-900">
          {teamName}
        </strong>

        <span className="text-sm font-black text-zinc-900">
          {percentage}%
        </span>
      </div>

      <div className="mt-3 h-2 border-2 border-zinc-900 bg-zinc-100 overflow-hidden">
        <div
          className="h-full bg-zinc-900"
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

type TeamRankingItemProps = {
  icon: React.ReactNode;
  label: string;
  teamName: string;
  percentage: number;
  colorClass: string;
  isExpanded: boolean;
  hidePercentage?: boolean;
};

function TeamRankingItem({
  icon,
  label,
  teamName,
  percentage,
  colorClass,
  isExpanded,
  hidePercentage
}: TeamRankingItemProps) {
  if (!isExpanded) {
    return (
      <div
        title={`${label}: ${teamName} ${!hidePercentage ? `— ${percentage}%` : ''}`}
        className="
          flex flex-col items-center
          px-1 py-2
          border-b-2 border-zinc-900 border-dashed
        "
      >
        <span className={colorClass.replace('text-zinc-400', 'text-zinc-900').replace('text-amber-400', 'text-amber-500')}>{icon}</span>

        {!hidePercentage && (
          <span className={`mt-1 text-xs font-black ${colorClass.replace('text-zinc-400', 'text-zinc-900').replace('text-amber-400', 'text-amber-500')}`}>
            {percentage}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 ${colorClass.replace('text-zinc-400', 'text-zinc-900').replace('text-amber-400', 'text-amber-500')}`}>
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
          {label}
        </p>

        <p className="mt-1 truncate text-xs font-black uppercase text-zinc-900">
          {teamName}
          {!hidePercentage && (
            <span className={`ml-1 ${colorClass.replace('text-zinc-400', 'text-zinc-900').replace('text-amber-400', 'text-amber-500')}`}>
              ({percentage}%)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
