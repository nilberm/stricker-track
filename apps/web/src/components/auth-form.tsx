'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { locales, type Locale } from '../i18n/config';
import { useRouter } from '../i18n/navigation';
import { apiRequest } from '../lib/api';
import {
  accessTokenKey,
  notifyAuthStateChanged,
  type AuthSession,
} from '../lib/auth';

type AuthFormProps = {
  mode: 'login' | 'register';
};

type FormValues = {
  name?: string;
  email: string;
  password: string;
  preferredLocale?: Locale;
};

const knownErrorCodes = [
  'EMAIL_ALREADY_EXISTS',
  'INVALID_CREDENTIALS',
  'UNAUTHORIZED',
  'VALIDATION_FAILED',
  'INTERNAL_SERVER_ERROR',
  'UNKNOWN_ERROR',
] as const;

export function AuthForm({ mode }: AuthFormProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const schema: z.ZodType<FormValues> = z.object({
    name:
      mode === 'register'
        ? z.string().min(2, t('errors.nameLength'))
        : z.string().optional(),
    email: z.string().email(t('errors.invalidEmail')),
    password: z.string().min(10, t('errors.passwordLength')),
    preferredLocale: z.enum(locales).optional(),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues:
      mode === 'register' ? { preferredLocale: locale } : undefined,
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === 'name' ||
          field === 'email' ||
          field === 'password' ||
          field === 'preferredLocale'
        ) {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      const session = await apiRequest<AuthSession>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(
          mode === 'login'
            ? { email: parsed.data.email, password: parsed.data.password }
            : parsed.data,
        ),
      });
      window.localStorage.setItem(accessTokenKey, session.accessToken);
      notifyAuthStateChanged();
      document.cookie = `NEXT_LOCALE=${session.user.preferredLocale}; path=/; max-age=31536000; samesite=lax`;
      setSuccess(true);
      router.replace('/my-collections', {
        locale: session.user.preferredLocale,
      });
    } catch (error: unknown) {
      setServerError(error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    }
  }

  const translatedServerError =
    serverError && knownErrorCodes.includes(serverError as never)
      ? t(`errors.${serverError as (typeof knownErrorCodes)[number]}`)
      : serverError
        ? t('errors.UNKNOWN_ERROR')
        : null;

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(submit)}
    >
      {mode === 'register' && (
        <Field
          error={errors.name?.message}
          label={t('auth.name')}
          registration={register('name')}
          type="text"
        />
      )}
      <Field
        error={errors.email?.message}
        label={t('auth.email')}
        registration={register('email')}
        type="email"
      />
      <Field
        error={errors.password?.message}
        label={t('auth.password')}
        registration={register('password')}
        type="password"
      />
      {mode === 'register' && (
        <label className="block space-y-2 text-sm font-semibold text-slate-300">
          <span>{t('auth.preferredLanguage')}</span>
          <select
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            {...register('preferredLocale')}
          >
            {locales.map((supportedLocale: Locale) => (
              <option key={supportedLocale} value={supportedLocale} className="bg-zinc-900 text-slate-100">
                {t(`languages.${supportedLocale}`)}
              </option>
            ))}
          </select>
        </label>
      )}
      {translatedServerError && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
          {translatedServerError}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-400">
          {t(`auth.${mode}Success`)}
        </p>
      )}
      <button
        className="w-full rounded-xl bg-amber-600 px-4 py-3 font-bold text-amber-950 shadow transition hover:bg-amber-500 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? t('common.loading') : t(`auth.${mode}Submit`)}
      </button>
    </form>
  );
}

type FieldProps = {
  error?: string;
  label: string;
  registration: UseFormRegisterReturn;
  type: 'email' | 'password' | 'text';
};

function Field({ error, label, registration, type }: FieldProps) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-slate-300">
      <span>{label}</span>
      <input
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        type={type}
        {...registration}
      />
      {error && <span className="block text-sm text-red-400">{error}</span>}
    </label>
  );
}
