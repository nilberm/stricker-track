import { getTranslations } from 'next-intl/server';
import { ProfileCard } from '../../../components/profile-card';
import { SupportProjectCard } from '../../../components/support-project-card';

export default async function ProfilePage() {
  const t = await getTranslations('profile');

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
        <h1 className="text-3xl font-black">{t('title')}</h1>
        <p className="mb-8 mt-2 text-slate-600">{t('description')}</p>
        <ProfileCard />
      </div>
      <SupportProjectCard />
    </div>
  );
}
