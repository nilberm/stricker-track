import { getTranslations } from 'next-intl/server';

export async function LegalPage({ type }: { type: 'privacy' | 'terms' }) {
  const t = await getTranslations(type);
  const sections = ['account', 'usage', 'external', 'retention', 'contact'];

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-5 py-14">
      <header className="space-y-3">
        <h1 className="text-4xl font-black">{t('title')}</h1>
        <p className="text-slate-600">{t('intro')}</p>
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          {t('legalReview')}
        </p>
      </header>
      {sections.map((section) => (
        <section className="space-y-2" key={section}>
          <h2 className="text-xl font-black">{t(`${section}Title`)}</h2>
          <p className="leading-7 text-slate-700">{t(`${section}Body`)}</p>
        </section>
      ))}
    </article>
  );
}
