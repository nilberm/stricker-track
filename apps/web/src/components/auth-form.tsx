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
        <label className="block space-y-2 text-sm font-black uppercase tracking-widest text-zinc-900">
          <span>{t('auth.preferredLanguage')}</span>
          <select
            className="w-full border-2 border-zinc-900 bg-white px-4 py-3 text-zinc-900 font-bold outline-none transition-all focus:shadow-[4px_4px_0px_#18181b] focus:-translate-y-0.5"
            {...register('preferredLocale')}
          >
            {locales.map((supportedLocale: Locale) => (
              <option key={supportedLocale} value={supportedLocale} className="bg-white text-zinc-900 font-bold">
                {t(`languages.${supportedLocale}`)}
              </option>
            ))}
          </select>
        </label>
      )}
      {translatedServerError && (
        <p className="border-2 border-red-600 bg-red-100 p-3 text-sm font-bold uppercase tracking-wide text-red-700 shadow-[4px_4px_0px_#dc2626]">
          {translatedServerError}
        </p>
      )}
      {success && (
        <p className="border-2 border-emerald-600 bg-emerald-100 p-3 text-sm font-bold uppercase tracking-wide text-emerald-700 shadow-[4px_4px_0px_#059669]">
          {t(`auth.${mode}Success`)}
        </p>
      )}
      <button
        className="mt-6 w-full border-2 border-zinc-900 bg-amber-400 px-4 py-4 font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b] hover:bg-amber-300 disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#18181b]"
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
    <label className="block space-y-2 text-sm font-black uppercase tracking-widest text-zinc-900">
      <span>{label}</span>
      <input
        className="w-full border-2 border-zinc-900 bg-white px-4 py-3 text-zinc-900 font-bold outline-none transition-all placeholder:text-zinc-500 focus:shadow-[4px_4px_0px_#18181b] focus:-translate-y-0.5"
        type={type}
        {...registration}
      />
      {error && <span className="block text-xs text-red-600 bg-red-100 border border-red-600 p-2 uppercase font-bold tracking-wider mt-1">{error}</span>}
    </label>
  );
}
