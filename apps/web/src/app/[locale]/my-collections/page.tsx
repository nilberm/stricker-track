import { getTranslations } from 'next-intl/server';
import { MyCollectionsClient } from '../../../components/collections/my-collections-client';

export default async function MyCollectionsPage() {
  const t = await getTranslations('myCollections');
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <p className="font-bold text-sky-700">{t('eyebrow')}</p>
        <h1 className="mt-2 text-4xl font-black">{t('title')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          {t('description')}
        </p>
      </header>
      <MyCollectionsClient />
    </div>
  );
}
