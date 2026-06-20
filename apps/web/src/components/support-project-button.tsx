'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { supportConfig } from '../lib/support-config';

type SupportProjectButtonProps = {
  className?: string;
  hideOnRestrictedRoutes?: boolean;
  url?: string | null;
};

export function SupportProjectButton({
  className = '',
  hideOnRestrictedRoutes = false,
  url = supportConfig.buyMeACoffeeUrl,
}: SupportProjectButtonProps) {
  const t = useTranslations('support');
  const pathname = usePathname();

  if (!url || (hideOnRestrictedRoutes && isRestrictedSupportRoute(pathname))) {
    return null;
  }

  return (
    <a
      aria-label={t('buttonAriaLabel')}
      className={`inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-950 transition hover:border-amber-400 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${className}`}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span aria-hidden="true" className="mr-2">
        +
      </span>
      {t('button')}
    </a>
  );
}

export function isRestrictedSupportRoute(pathname: string) {
  return (
    /\/scan\/?$/.test(pathname) ||
    /\/login\/?$/.test(pathname) ||
    /\/register\/?$/.test(pathname)
  );
}
