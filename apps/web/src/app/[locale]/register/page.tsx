import { getTranslations } from 'next-intl/server';
import { AuthForm } from '../../../components/auth-form';
import { Link } from '../../../i18n/navigation';

export default async function RegisterPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl border border-zinc-800/50 bg-zinc-900/50 p-7 backdrop-blur-md shadow-xl shadow-black/40">
        <h1 className="text-3xl font-black text-slate-100">{t('auth.registerTitle')}</h1>
        <p className="mb-8 mt-2 text-slate-400">
          {t('auth.registerDescription')}
        </p>
        <AuthForm mode="register" />
        <p className="mt-6 text-center text-sm text-slate-400">
          {t('auth.hasAccount')}{' '}
          <Link className="font-bold text-amber-500 hover:text-amber-400 transition" href="/login">
            {t('navigation.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
