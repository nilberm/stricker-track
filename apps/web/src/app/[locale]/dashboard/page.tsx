import { getTranslations } from 'next-intl/server';
import { DashboardClient } from '../../../components/catalog/dashboard-client';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">
        {t('eyebrow')}
      </p>
      <h1 className="mt-3 text-4xl font-black">{t('title')}</h1>
      <p className="mb-8 mt-3 text-lg text-slate-600">{t('description')}</p>
      <DashboardClient />
    </div>
  );
}
