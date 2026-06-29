'use client';

import { useTranslations } from 'next-intl';
import { SupportProjectCard } from './support-project-card';
import { Link } from '../i18n/navigation';
import { useThemeStore } from '../stores/theme-store';

function DefaultFooter() {
  const t = useTranslations();
  return (
    <footer className="mt-12 bg-zinc-950">
      <div className="h-2 w-full bg-striped-colorful"></div>
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-12">
        <SupportProjectCard compact />
        <p className="text-sm font-medium leading-6 text-zinc-400">
          {t('footer.independence')}
        </p>
        <nav className="flex gap-6 text-sm font-bold uppercase tracking-widest text-yellow-400">
          <Link href="/privacy" className="hover:text-yellow-300 transition-colors">{t('footer.privacy')}</Link>
          <Link href="/terms" className="hover:text-yellow-300 transition-colors">{t('footer.terms')}</Link>
        </nav>
      </div>
    </footer>
  );
}

function WorldCupFooter() {
  const t = useTranslations();
  // TODO: Specific World Cup Footer
  return (
    <footer className="mt-12 bg-[#2b3088]">
      <div className="h-2 w-full bg-world-cup-stripes"></div>
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-12">
        <SupportProjectCard compact />
        <p className="text-sm font-medium leading-6 text-zinc-300">
          {t('footer.independence')}
        </p>
        <nav className="flex gap-6 text-sm font-bold uppercase tracking-widest text-[#c4d600]">
          <Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
          <Link href="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
        </nav>
      </div>
    </footer>
  );
}

export function SiteFooter() {
  const activeTheme = useThemeStore((s) => s.activeTheme);

  if (activeTheme === 'world-cup-2026') {
    return <WorldCupFooter />;
  }

  return <DefaultFooter />;
}
