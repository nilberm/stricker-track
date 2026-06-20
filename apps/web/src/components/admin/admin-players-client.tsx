'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { accessTokenKey } from '../../lib/auth';
import { listAdminPlayers, type AdminPlayer } from '../../lib/admin';
import { Link } from '../../i18n/navigation';
import { AdminNavigation } from './catalog-import-client';

export function AdminPlayersClient() {
  const t = useTranslations('admin');
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [search, setSearch] = useState('');
  const [needsReview, setNeedsReview] = useState(true);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) return;
    const query = new URLSearchParams({ limit: '100' });
    if (search) query.set('search', search);
    if (needsReview) query.set('needsReview', 'true');
    setStatus('loading');
    void listAdminPlayers(token, query)
      .then((result) => {
        setPlayers(result.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [needsReview, search]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <AdminNavigation />
      <h1 className="mt-6 text-4xl font-black">{t('playersTitle')}</h1>
      <div className="mt-6 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-[1fr_auto]">
        <input
          aria-label={t('searchPlayer')}
          className="rounded-xl border border-slate-300 px-4 py-3"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('searchPlayer')}
          value={search}
        />
        <label className="flex items-center gap-2 px-3 font-semibold">
          <input
            checked={needsReview}
            onChange={(event) => setNeedsReview(event.target.checked)}
            type="checkbox"
          />
          {t('needsReview')}
        </label>
      </div>
      {status === 'error' ? (
        <p className="mt-6 text-red-700">{t('requestError')}</p>
      ) : null}
      <div className="mt-6 grid gap-3">
        {players.map((player) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-sky-300"
            href={`/admin/players/${player.id}`}
            key={player.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black">{player.name}</h2>
                <p className="text-sm text-slate-500">
                  {player.countryCode ?? t('notAvailable')} ·{' '}
                  {player._count?.stickers ?? 0} {t('stickers')}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                {t(`enrichmentStatus.${player.enrichmentStatus}`)}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {status === 'ready' && !players.length ? (
        <p className="mt-8 text-center text-slate-500">{t('noPlayers')}</p>
      ) : null}
    </div>
  );
}
