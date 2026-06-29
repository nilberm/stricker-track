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
      className={`inline-flex items-center justify-center border-2 border-zinc-900 bg-amber-400 px-4 py-2.5 text-sm font-black uppercase tracking-widest text-zinc-900 shadow-[2px_2px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181b] focus-visible:outline-none ${className}`}
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
