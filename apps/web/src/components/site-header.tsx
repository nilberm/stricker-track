import { getTranslations } from 'next-intl/server';
import { Link } from '../i18n/navigation';
import { HeaderNavigation } from './header-navigation';

export async function SiteHeader() {
  const t = await getTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link className="text-xl font-black tracking-tight text-slate-100" href="/">
          {t('brand.name')}
        </Link>
        <HeaderNavigation />
      </div>
    </header>
  );
}
