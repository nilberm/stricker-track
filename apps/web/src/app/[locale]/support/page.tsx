import { getTranslations } from 'next-intl/server';
import { SupportProjectButton } from '../../../components/support-project-button';
import { Link } from '../../../i18n/navigation';
import { supportConfig } from '../../../lib/support-config';

export default async function SupportPage() {
  const t = await getTranslations('support');

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10">
        <p className="font-bold text-amber-700">{t('eyebrow')}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">
          {t('title')}
        </h1>
        <div className="mt-6 space-y-4 text-base leading-7 text-slate-600">
          <p>{t('description')}</p>
          <p>{t('voluntary')}</p>
          <p>{t('howItHelps')}</p>
          <p className="font-semibold text-slate-800">{t('noBenefits')}</p>
        </div>

        <div className="mt-8">
          {supportConfig.buyMeACoffeeUrl ? (
            <SupportProjectButton />
          ) : (
            <p
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
              role="status"
            >
              {t('notConfigured')}
            </p>
          )}
        </div>

        <aside className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-5">
          <h2 className="font-black text-sky-950">{t('independenceTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-sky-900">
            {t('independenceNotice')}
          </p>
        </aside>

        <Link
          className="mt-8 inline-flex text-sm font-bold text-sky-700 underline"
          href="/"
        >
          {t('back')}
        </Link>
      </article>
    </div>
  );
}
