import { getTranslations } from 'next-intl/server';
import { AuthForm } from '../../../components/auth-form';
import { Link } from '../../../i18n/navigation';

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <div className="w-full flex-1 flex flex-col relative bg-[#f4f0e6]">
      {/* Brutalist dotted background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#18181b 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
      
      <div className="mx-auto w-full max-w-md px-5 py-16 lg:py-24 relative z-10 flex-1 flex flex-col justify-center">
        <div className="border-4 border-zinc-900 bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#18181b]">
          <div className="mb-8">
            <h1 className="text-4xl font-black uppercase text-zinc-900 tracking-tighter leading-none">{t('auth.loginTitle')}</h1>
            <p className="mt-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">{t('auth.loginDescription')}</p>
          </div>
          
          <AuthForm mode="login" />
          
          <Link
            className="mt-6 block text-center text-sm font-black uppercase tracking-widest text-zinc-900 hover:text-amber-500 transition-colors hover:underline decoration-2 underline-offset-4"
            href="/forgot-password"
          >
            {t('auth.forgotLink')}
          </Link>
          
          <div className="mt-8 border-t-2 border-zinc-900 pt-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500">
              {t('auth.noAccount')}{' '}
              <Link className="text-zinc-900 hover:text-amber-500 transition-colors hover:underline decoration-2 underline-offset-4" href="/register">
                {t('navigation.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
