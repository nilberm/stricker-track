'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  deleteAdminImage,
  enrichAdminPlayer,
  getAdminPlayer,
  searchPlayerCandidates,
  updateAdminImage,
  type AdminPlayer,
  type PlayerCandidate,
} from '../../lib/admin';
import { accessTokenKey } from '../../lib/auth';
import { AdminNavigation } from './catalog-import-client';

export function AdminPlayerDetailClient({ playerId }: { playerId: string }) {
  const t = useTranslations('admin');
  const [player, setPlayer] = useState<AdminPlayer | null>(null);
  const [candidates, setCandidates] = useState<PlayerCandidate[]>([]);
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'searching' | 'saving' | 'error'
  >('loading');

  function token() {
    return window.localStorage.getItem(accessTokenKey)!;
  }

  function reload() {
    setStatus('loading');
    void getAdminPlayer(token(), playerId)
      .then((data) => {
        setPlayer(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(reload, [playerId]);

  async function search() {
    if (!player) return;
    setStatus('searching');
    try {
      const query = new URLSearchParams({ name: player.name });
      if (player.countryCode) query.set('countryCode', player.countryCode);
      setCandidates(await searchPlayerCandidates(token(), playerId, query));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  async function enrich(candidate: PlayerCandidate) {
    setStatus('saving');
    try {
      await enrichAdminPlayer(token(), playerId, candidate.externalId);
      setCandidates([]);
      reload();
    } catch {
      setStatus('error');
    }
  }

  async function reviewImage(
    imageId: string,
    reviewStatus: 'APPROVED' | 'REJECTED',
  ) {
    setStatus('saving');
    try {
      await updateAdminImage(token(), imageId, {
        reviewStatus,
        isPrimary: reviewStatus === 'APPROVED',
      });
      reload();
    } catch {
      setStatus('error');
    }
  }

  if (!player) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center">
        {status === 'error' ? t('requestError') : t('loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <AdminNavigation />
      <header className="mt-6">
        <p className="font-bold text-sky-700">{player.countryCode}</p>
        <h1 className="text-4xl font-black">{player.name}</h1>
        <p className="mt-2 text-slate-600">
          {player.wikidataId ?? t('withoutAssociation')}
        </p>
      </header>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">{t('providerCandidates')}</h2>
          <button
            className="rounded-xl bg-sky-600 px-4 py-3 font-bold text-white disabled:opacity-50"
            disabled={status === 'searching' || status === 'saving'}
            onClick={() => void search()}
            type="button"
          >
            {t('searchPlayer')}
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          {candidates.map((candidate) => (
            <article
              className="rounded-xl border border-slate-200 p-4"
              key={candidate.externalId}
            >
              <h3 className="font-black">{candidate.name}</h3>
              <p className="text-sm text-slate-600">
                {candidate.description ?? t('notAvailable')}
              </p>
              <p className="mt-1 text-sm">
                {candidate.country ?? t('notAvailable')} ·{' '}
                {candidate.birthDate ?? t('notAvailable')}
              </p>
              <button
                className="mt-3 font-bold text-sky-700"
                onClick={() => void enrich(candidate)}
                type="button"
              >
                {t('selectCandidate')}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black">{t('reviewImage')}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {player.images.map((image) => (
            <article className="rounded-xl border p-4" key={image.id}>
              <img
                alt=""
                className="aspect-square w-full rounded-lg object-cover"
                src={image.url}
              />
              <dl className="mt-3 text-sm">
                <dt className="text-slate-500">{t('author')}</dt>
                <dd>{image.author ?? t('notAvailable')}</dd>
                <dt className="mt-2 text-slate-500">{t('license')}</dt>
                <dd>{image.license ?? t('notAvailable')}</dd>
              </dl>
              <a
                className="mt-3 block font-bold text-sky-700 underline"
                href={image.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {t('source')}
              </a>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="font-bold text-emerald-700"
                  onClick={() => void reviewImage(image.id, 'APPROVED')}
                  type="button"
                >
                  {t('approve')}
                </button>
                <button
                  className="font-bold text-amber-700"
                  onClick={() => void reviewImage(image.id, 'REJECTED')}
                  type="button"
                >
                  {t('reject')}
                </button>
                <button
                  className="font-bold text-red-700"
                  onClick={async () => {
                    await deleteAdminImage(token(), image.id);
                    reload();
                  }}
                  type="button"
                >
                  {t('remove')}
                </button>
              </div>
            </article>
          ))}
        </div>
        {!player.images.length ? (
          <p className="mt-5 text-slate-500">{t('withoutImage')}</p>
        ) : null}
      </section>
    </div>
  );
}
