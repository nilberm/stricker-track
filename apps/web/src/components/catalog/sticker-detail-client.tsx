'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/config';
import { Link } from '../../i18n/navigation';
import { authenticatedApiRequest } from '../../lib/api';
import { accessTokenKey } from '../../lib/auth';
import type { CollectionSummary, StickerSummary } from '../../lib/catalog';
import { Avatar } from './avatar';
import { PlayerImageAttribution } from './player-image-attribution';

export function StickerDetailClient({
  slug,
  stickerId,
}: {
  slug: string;
  stickerId: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [sticker, setSticker] = useState<StickerSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) {
      setStatus('error');
      return;
    }
    void authenticatedApiRequest<CollectionSummary>(
      `/collections/${slug}?locale=${locale}`,
      token,
    )
      .then((collection) =>
        authenticatedApiRequest<StickerSummary>(
          `/collections/${collection.id}/stickers/${stickerId}?locale=${locale}`,
          token,
        ),
      )
      .then((data) => {
        setSticker(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [locale, slug, stickerId]);

  if (status === 'loading') return <DetailState text={t('common.loading')} />;
  if (status === 'error' || !sticker) {
    return <DetailState text={t('catalog.detailError')} />;
  }

  const displayName =
    sticker.player?.displayName ?? sticker.player?.name ?? sticker.name;
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link className="font-bold text-sky-700" href={`/collections/${slug}`}>
        {t('common.backCollection')}
      </Link>
      <article className="mt-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row">
          <Avatar
            imageUrl={sticker.player?.image?.url}
            name={displayName}
            size="large"
          />
          {sticker.player?.image ? (
            <PlayerImageAttribution image={sticker.player.image} />
          ) : null}
          <div>
            <p className="text-xl font-black text-sky-700">{sticker.code}</p>
            <h1 className="mt-2 text-3xl font-black">{sticker.name}</h1>
            <p className="mt-2 text-slate-500">
              {sticker.section?.name ?? t('catalog.noSection')}
            </p>
            <p className="mt-2 font-bold">
              {t(`stickerTypes.${sticker.type}`)}
            </p>
          </div>
        </div>
        {sticker.player ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-black">{t('details.player')}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label={t('details.name')} value={sticker.player.name} />
              <Detail
                label={t('details.country')}
                value={sticker.player.nationality ?? sticker.player.countryCode}
              />
              <Detail
                label={t('details.position')}
                value={sticker.player.position}
              />
            </dl>
          </section>
        ) : (
          <p className="mt-8 border-t border-slate-200 pt-6 text-slate-500">
            {t('details.noPlayer')}
          </p>
        )}
      </article>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  const t = useTranslations();
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="font-bold">{value ?? t('common.notAvailable')}</dd>
    </div>
  );
}

function DetailState({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-center text-slate-600">
      {text}
    </div>
  );
}
