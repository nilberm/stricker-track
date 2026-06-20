import { getTranslations } from 'next-intl/server';
import { PasswordRecoveryForm } from '../../../components/password-recovery-form';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getTranslations();
  const { token = '' } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
        <h1 className="text-3xl font-black">{t('auth.resetTitle')}</h1>
        <p className="mb-8 mt-2 text-slate-600">{t('auth.resetDescription')}</p>
        <PasswordRecoveryForm mode="reset" token={token} />
      </div>
    </div>
  );
}
