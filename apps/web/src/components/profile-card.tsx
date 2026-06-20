'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { locales, type Locale } from '../i18n/config';
import { useRouter } from '../i18n/navigation';
import { apiRequest } from '../lib/api';
import {
  accessTokenKey,
  notifyAuthStateChanged,
  type AuthUser,
} from '../lib/auth';

export function ProfileCard() {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferredLocale, setPreferredLocale] = useState<Locale>(currentLocale);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saved' | 'error'>(
    'loading',
  );
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) {
      setStatus('error');
      return;
    }

    void apiRequest<AuthUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((profile) => {
        setUser(profile);
        setPreferredLocale(profile.preferredLocale);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  async function savePreference() {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) return;

    const updated = await apiRequest<AuthUser>('/users/me/preferences', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ preferredLocale }),
    });
    setUser(updated);
    document.cookie = `NEXT_LOCALE=${preferredLocale}; path=/; max-age=31536000; samesite=lax`;
    setStatus('saved');
    router.replace('/profile', { locale: preferredLocale });
  }

  function signOut() {
    window.localStorage.removeItem(accessTokenKey);
    notifyAuthStateChanged();
    router.replace('/login');
  }

  async function deleteAccount() {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token || deleteConfirmation !== 'DELETE') return;
    setDeleteError(false);
    try {
      await apiRequest('/users/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });
      signOut();
    } catch {
      setDeleteError(true);
    }
  }

  if (status === 'loading') {
    return <p>{t('common.loading')}</p>;
  }

  if (status === 'error' || !user) {
    return (
      <div className="space-y-4">
        <p>{t('profile.sessionRequired')}</p>
        <button
          className="rounded-xl bg-sky-600 px-4 py-3 font-bold text-white"
          onClick={() => router.replace('/login')}
          type="button"
        >
          {t('navigation.login')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">{t('profile.name')}</dt>
          <dd className="font-bold">{user.name}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">{t('profile.email')}</dt>
          <dd className="font-bold">{user.email}</dd>
        </div>
      </dl>
      <label className="block space-y-2 text-sm font-semibold">
        <span>{t('profile.preferredLanguage')}</span>
        <select
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          value={preferredLocale}
          onChange={(event) => setPreferredLocale(event.target.value as Locale)}
        >
          {locales.map((locale: Locale) => (
            <option key={locale} value={locale}>
              {t(`languages.${locale}`)}
            </option>
          ))}
        </select>
      </label>
      {status === 'saved' && (
        <p className="text-sm font-medium text-emerald-700">
          {t('profile.saveSuccess')}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-sky-600 px-4 py-3 font-bold text-white"
          onClick={() => void savePreference()}
          type="button"
        >
          {t('common.save')}
        </button>
        <button
          className="rounded-xl border border-slate-300 px-4 py-3 font-bold"
          onClick={signOut}
          type="button"
        >
          {t('profile.signOut')}
        </button>
      </div>
      <section className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5">
        <div>
          <h2 className="font-black text-red-900">
            {t('profile.deleteTitle')}
          </h2>
          <p className="mt-1 text-sm text-red-800">
            {t('profile.deleteDescription')}
          </p>
        </div>
        <label className="block space-y-2 text-sm font-semibold">
          <span>{t('profile.currentPassword')}</span>
          <input
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3"
            onChange={(event) => setDeletePassword(event.target.value)}
            type="password"
            value={deletePassword}
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold">
          <span>{t('profile.deleteConfirmation')}</span>
          <input
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3"
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={t('profile.deleteConfirmationPlaceholder')}
            type="text"
            value={deleteConfirmation}
          />
        </label>
        {deleteError && (
          <p className="text-sm font-semibold text-red-800">
            {t('profile.deleteError')}
          </p>
        )}
        <button
          className="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:opacity-50"
          disabled={
            deleteConfirmation !== 'DELETE' || deletePassword.length < 10
          }
          onClick={() => void deleteAccount()}
          type="button"
        >
          {t('profile.deleteSubmit')}
        </button>
      </section>
    </div>
  );
}
