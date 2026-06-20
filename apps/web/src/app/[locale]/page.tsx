import { getTranslations } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { LandingClient } from './landing-client';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <LandingClient>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <section className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-red-500 drop-shadow-sm">
              {t('eyebrow')}
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-100 drop-shadow-md sm:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-amber-100/70">
              {t('description')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-xl border-t border-amber-400/50 bg-gradient-to-b from-amber-600 to-amber-800 px-6 py-3 font-bold tracking-wider uppercase text-amber-50 shadow-md shadow-black/50 transition hover:from-amber-500 hover:to-amber-700"
                href="/register"
              >
                {t('primaryAction')}
              </Link>
              <Link
                className="rounded-xl border border-amber-700/50 bg-zinc-900/50 px-6 py-3 font-bold tracking-wider uppercase text-amber-500 shadow-inner transition hover:bg-zinc-800/80 hover:text-amber-400"
                href="/login"
              >
                {t('secondaryAction')}
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-amber-700/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 p-7 shadow-inner">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-red-950/40 to-transparent pointer-events-none" />
            <h2 className="relative z-10 text-xl font-black text-slate-100 drop-shadow-md">{t('phaseTitle')}</h2>
            <ul className="relative z-10 mt-6 space-y-4">
              {['phaseSetup', 'phaseLanguages', 'phaseAuth'].map((key) => (
                <li
                  className="rounded-2xl border border-amber-700/30 bg-zinc-900/60 p-4 leading-6 text-amber-100/70 shadow-inner"
                  key={key}
                >
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </LandingClient>
  );
}
