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

export function CollectorSidebar({
  isExpanded,
  setIsExpanded,
  progress,
}: CollectorSidebarProps) {
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
    .sort((a, b) => b.percentage - a.percentage)[0] || { name: 'Nenhuma', percentage: 0 };
    
  // Exploração (lowest percentage)
  const exploracao = [...sections]
    .sort((a, b) => a.percentage - b.percentage)[0] || { name: 'Nenhuma', percentage: 0 };
    
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
        aria-label={isExpanded ? "Recolher painel" : "Expandir painel"}
        className="
          absolute -right-8 top-6 z-10
          flex h-10 w-8
          items-center justify-center
          rounded-r-xl
          border border-l-0 border-white/10
          bg-[#19191f]
          text-amber-500
          transition-colors
          hover:bg-[#222229]
          focus:outline-none
        "
      >
        {isExpanded ? (
          <ChevronLeft size={18} />
        ) : (
          <ChevronRight size={18} />
        )}
      </button>

      <div
        className="
          relative
          h-[calc(100vh-112px)]
          overflow-hidden
          rounded-r-3xl
          border border-l-0 border-white/10
          bg-[#121216]/95
          shadow-2xl
          shadow-black/50
          backdrop-blur-xl
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
          <SidebarHeader isExpanded={isExpanded} />

          <div className={isExpanded ? "mt-6" : "mt-5"}>
            <ProgressCard
              isExpanded={isExpanded}
              percentage={globalPercentage}
              collected={collectedStickers}
              total={totalStickers}
            />
          </div>

          <div
            className={`
              mt-5 border-t border-white/10 pt-5
              ${isExpanded ? "space-y-3" : "space-y-2"}
            `}
          >
            <StatItem
              icon={<CircleCheck size={20} />}
              label="Figurinhas coladas"
              value={collectedStickers}
              colorClass="text-emerald-400"
              isExpanded={isExpanded}
            />

            <StatItem
              icon={<Search size={20} />}
              label="Ainda faltam"
              value={missingStickers}
              colorClass="text-pink-500"
              isExpanded={isExpanded}
            />

            <StatItem
              icon={<Copy size={20} />}
              label="Repetidas (Troca)"
              value={duplicateStickers}
              colorClass="text-violet-400"
              isExpanded={isExpanded}
            />
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <CurrentTeamCard
              isExpanded={isExpanded}
              teamName={noAlvo.name}
              percentage={noAlvo.percentage}
            />
          </div>

          <div
            className={`
              mt-5 border-t border-white/10 pt-5
              ${isExpanded ? "space-y-4" : "space-y-2"}
            `}
          >
            <TeamRankingItem
              icon={<Trophy size={19} />}
              label="Glória (100%)"
              teamName={`${gloria} Seleções completas`}
              percentage={gloria > 0 ? 100 : 0}
              colorClass="text-amber-400"
              isExpanded={isExpanded}
              hidePercentage={true}
            />

            <TeamRankingItem
              icon={<Flag size={19} />}
              label="Exploração"
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
};

function SidebarHeader({ isExpanded }: SidebarHeaderProps) {
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
          rounded-2xl
          bg-amber-500/10
          text-amber-500
        "
      >
        <Album size={23} />
      </div>

      {isExpanded && (
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Minhas Coleções
          </p>

          <h2 className="truncate text-base font-bold uppercase tracking-wide text-amber-500">
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
};

function ProgressCard({
  isExpanded,
  percentage,
  collected,
  total,
}: ProgressCardProps) {
  if (!isExpanded) {
    return (
      <div
        className="
          flex flex-col items-center
          rounded-2xl
          bg-white/[0.04]
          px-2 py-3
        "
        title={`Progresso global: ${percentage}%`}
      >
        <Sparkles size={19} className="text-amber-500" />

        <span className="mt-2 text-lg font-black text-amber-500">
          {percentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.04] p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Progresso global
          </p>

          <p className="mt-1 text-4xl font-black text-amber-500">
            {percentage}%
          </p>
        </div>

        <p className="pb-1 text-sm font-semibold text-zinc-400">
          {collected}/{total}
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="
            h-full rounded-full
            bg-gradient-to-r
            from-amber-600
            to-amber-400
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
          rounded-xl
          bg-white/[0.035]
          px-1 py-2
          transition-colors
          hover:bg-white/[0.07]
        "
      >
        <span className={colorClass}>{icon}</span>

        <span className="mt-1 text-sm font-bold text-zinc-100">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div
      className="
        flex items-center justify-between gap-4
        rounded-xl
        bg-white/[0.035]
        px-3 py-3
        transition-colors
        hover:bg-white/[0.07]
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={colorClass}>{icon}</span>

        <span className="truncate text-sm font-medium text-zinc-400">
          {label}
        </span>
      </div>

      <strong className={`text-lg ${colorClass}`}>
        {value}
      </strong>
    </div>
  );
}

type CurrentTeamCardProps = {
  isExpanded: boolean;
  teamName: string;
  percentage: number;
};

function CurrentTeamCard({
  isExpanded,
  teamName,
  percentage,
}: CurrentTeamCardProps) {
  if (!isExpanded) {
    return (
      <div
        title={`${teamName}: ${percentage}% completo`}
        className="
          flex flex-col items-center
          rounded-xl
          bg-amber-500/10
          px-1 py-3
        "
      >
        <Flag size={20} className="text-amber-500" />

        <span className="mt-1 text-sm font-bold text-amber-300">
          {percentage}%
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        🎯 No Alvo
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <strong className="truncate text-base text-zinc-100">
          {teamName}
        </strong>

        <span className="text-sm font-bold text-amber-500">
          {percentage}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-500"
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
          rounded-xl
          px-1 py-2
          transition-colors
          hover:bg-white/[0.05]
        "
      >
        <span className={colorClass}>{icon}</span>

        {!hidePercentage && (
          <span className={`mt-1 text-xs font-bold ${colorClass}`}>
            {percentage}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 ${colorClass}`}>
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
          {teamName}
          {!hidePercentage && (
            <span className={`ml-1 ${colorClass}`}>
              ({percentage}%)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
