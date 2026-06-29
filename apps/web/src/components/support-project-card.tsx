'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '../i18n/navigation';
import { supportConfig } from '../lib/support-config';
import {
  isRestrictedSupportRoute,
  SupportProjectButton,
} from './support-project-button';

export function SupportProjectCard({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('support');
  const pathname = usePathname();

  if (
    !supportConfig.buyMeACoffeeUrl ||
    (compact && isRestrictedSupportRoute(pathname))
  ) {
    return null;
  }

  return (
    <section
      className={
        compact
          ? 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-inner'
          : 'border-4 border-zinc-900 bg-emerald-300 p-5 shadow-[4px_4px_0px_#18181b]'
      }
    >
      <div>
        <h2
          className={
            compact ? 'font-bold text-slate-700' : 'text-xl font-black'
          }
        >
          {t('title')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          {t('voluntary')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="text-sm font-bold text-sky-700 underline"
          href="/support"
        >
          {t('learnMore')}
        </Link>
        <SupportProjectButton />
      </div>
    </section>
  );
}
