import { getTranslations } from 'next-intl/server';
import { SupportProjectCard } from './support-project-card';
import { Link } from '../i18n/navigation';

export async function SiteFooter() {
  const t = await getTranslations();

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <SupportProjectCard compact />
        <p className="text-sm leading-6 text-zinc-500">
          {t('footer.independence')}
        </p>
        <nav className="flex gap-4 text-sm font-bold text-amber-600">
          <Link href="/privacy" className="hover:text-amber-500 transition-colors">{t('footer.privacy')}</Link>
          <Link href="/terms" className="hover:text-amber-500 transition-colors">{t('footer.terms')}</Link>
        </nav>
      </div>
    </footer>
  );
}
