import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';
import type { ProgressSection } from '../../../lib/personal-collections';

function getFlagEmoji(countryCode: string) {
  if (!/^[A-Z]{2}$/.test(countryCode)) return null;
  const codePoints = countryCode
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function NationalTeamCard({
  section,
  userCollectionId,
}: {
  section: ProgressSection;
  userCollectionId: string;
}) {
  const t = useTranslations('myCollections');
  let flagNode: React.ReactNode = null;
  if (section.code === 'ENG') {
    flagNode = <img src="/flags/england.png" alt="England Flag" className="h-6 w-8 object-cover rounded-[2px] shadow-sm" />;
  } else if (section.code === 'SCO') {
    flagNode = <img src="/flags/scotland.png" alt="Scotland Flag" className="h-6 w-8 object-cover rounded-[2px] shadow-sm" />;
  } else if (section.countryIso2) {
    flagNode = getFlagEmoji(section.countryIso2);
  }

  return (
    <Link
      className="group block rounded-3xl border border-amber-900/30 bg-gradient-to-br from-zinc-800 to-zinc-900 p-5 shadow-inner transition-shadow hover:shadow-lg hover:shadow-black/50 focus:outline-none focus:ring-4 focus:ring-amber-500/50"
      href={`/my-collections/${userCollectionId}/sections/${section.sectionId}`}
      aria-label={`${section.name}. ${t('sectionProgress', { owned: section.owned, total: section.total })}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/50 text-2xl shadow-inner">
          {flagNode ?? <span className="text-sm font-bold text-amber-500">{section.code}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-zinc-100 drop-shadow-md transition-colors group-hover:text-amber-400">
            {section.name}
          </h3>
          <p className="text-sm font-semibold tracking-wider text-amber-500/70">{section.code}</p>
        </div>
        <div className="text-right">
          <strong className="block text-xl font-black text-zinc-100 drop-shadow-md">
            {section.percentage}%
          </strong>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-bold tracking-widest text-amber-100/70">
            <span>{section.owned} / {section.total}</span>
            <div className="flex gap-2">
              {section.missing > 0 && <span className="text-rose-500">{section.missing} {t('missing')}</span>}
              {section.duplicates > 0 && <span className="text-amber-500">{section.duplicates} rep.</span>}
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${section.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
