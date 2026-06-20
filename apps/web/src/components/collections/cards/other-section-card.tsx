import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';
import type { ProgressSection } from '../../../lib/personal-collections';

export function OtherSectionCard({
  section,
  userCollectionId,
}: {
  section: ProgressSection;
  userCollectionId: string;
}) {
  const t = useTranslations();

  return (
    <Link
      className="group flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
      href={`/my-collections/${userCollectionId}/sections/${section.sectionId}`}
      aria-label={`${section.name}. ${t('myCollections.sectionProgress', { owned: section.owned, total: section.total })}`}
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-slate-800">{section.name}</h3>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t(`sectionTypes.${section.type}`)}
        </p>
      </div>

      <div className="text-right">
        <span className="block font-black text-slate-800">
          {section.owned} <span className="text-slate-400">/ {section.total}</span>
        </span>
        <div className="mt-1 flex justify-end gap-2 text-xs font-bold">
          {section.missing > 0 && <span className="text-rose-500">{section.missing} {t('myCollections.missing')}</span>}
          {section.duplicates > 0 && <span className="text-amber-500">{section.duplicates} rep.</span>}
        </div>
      </div>
    </Link>
  );
}
