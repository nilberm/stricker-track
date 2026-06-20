import { getTranslations } from 'next-intl/server';
import { PasswordRecoveryForm } from '../../../components/password-recovery-form';

export default async function ForgotPasswordPage() {
  const t = await getTranslations();
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl border border-zinc-800/50 bg-zinc-900/50 p-7 backdrop-blur-md shadow-xl shadow-black/40">
        <h1 className="text-3xl font-black text-slate-100">{t('auth.forgotTitle')}</h1>
        <p className="mb-8 mt-2 text-slate-400">
          {t('auth.forgotDescription')}
        </p>
        <PasswordRecoveryForm mode="forgot" />
      </div>
    </div>
  );
}
