import { getTranslations } from 'next-intl/server';
import { MyCollectionsClient } from '../../../components/collections/my-collections-client';

export default async function MyCollectionsPage() {
  const t = await getTranslations('myCollections');
  return (
    <div className="w-full flex-1 flex flex-col relative bg-[#f4f0e6]">
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#18181b 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
      <div className="mx-auto max-w-6xl w-full px-5 py-10 lg:py-16 relative z-10">
        <header className="mb-12 border-4 border-zinc-900 bg-white p-6 shadow-[8px_8px_0px_#18181b]">
          <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">{t('eyebrow')}</p>
          <h1 className="mt-1 text-5xl font-black uppercase tracking-tighter text-zinc-900 leading-none">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-lg font-bold text-zinc-600">
            {t('description')}
          </p>
        </header>
        <MyCollectionsClient />
      </div>
    </div>
  );
}
