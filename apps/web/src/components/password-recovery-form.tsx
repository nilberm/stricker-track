'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiRequest } from '../lib/api';
import { Link, useRouter } from '../i18n/navigation';

type Props = { mode: 'forgot' } | { mode: 'reset'; token: string };

export function PasswordRecoveryForm(props: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('loading');
    try {
      if (props.mode === 'forgot') {
        await apiRequest('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      } else {
        await apiRequest('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: props.token, password }),
        });
      }
      setStatus('success');
      if (props.mode === 'reset') {
        window.setTimeout(() => router.replace('/login'), 1200);
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void submit(event)}>
      <label className="block space-y-2 text-sm font-semibold text-slate-300">
        <span>
          {props.mode === 'forgot' ? t('auth.email') : t('auth.newPassword')}
        </span>
        <input
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          minLength={props.mode === 'reset' ? 10 : undefined}
          onChange={(event) =>
            props.mode === 'forgot'
              ? setEmail(event.target.value)
              : setPassword(event.target.value)
          }
          required
          type={props.mode === 'forgot' ? 'email' : 'password'}
          value={props.mode === 'forgot' ? email : password}
        />
      </label>
      {props.mode === 'reset' && !props.token && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
          {t('auth.resetInvalid')}
        </p>
      )}
      {status === 'success' && (
        <p className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-400">
          {t(
            props.mode === 'forgot'
              ? 'auth.forgotSuccess'
              : 'auth.resetSuccess',
          )}
        </p>
      )}
      {status === 'error' && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
          {t('auth.recoveryError')}
        </p>
      )}
      <button
        className="w-full rounded-xl bg-amber-600 px-4 py-3 font-bold text-amber-950 shadow transition hover:bg-amber-500 disabled:opacity-60"
        disabled={
          status === 'loading' || (props.mode === 'reset' && !props.token)
        }
        type="submit"
      >
        {status === 'loading'
          ? t('common.loading')
          : t(
              props.mode === 'forgot'
                ? 'auth.forgotSubmit'
                : 'auth.resetSubmit',
            )}
      </button>
      <Link className="block text-center font-bold text-amber-500 hover:text-amber-400 transition" href="/login">
        {t('auth.backToLogin')}
      </Link>
    </form>
  );
}
