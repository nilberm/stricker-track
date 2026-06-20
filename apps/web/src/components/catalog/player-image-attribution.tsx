'use client';

import { useTranslations } from 'next-intl';

export function PlayerImageAttribution({
  image,
}: {
  image: {
    sourceUrl: string;
    author: string | null;
    license: string | null;
    licenseUrl: string | null;
  };
}) {
  const t = useTranslations('attribution');
  return (
    <p className="mt-3 text-xs leading-5 text-slate-500">
      {t('photoBy')}{' '}
      <span className="font-semibold">
        {image.author ?? t('unknownAuthor')}
      </span>
      {' - '}
      {image.licenseUrl ? (
        <a
          className="underline"
          href={image.licenseUrl}
          rel="noreferrer"
          target="_blank"
        >
          {image.license ?? t('license')}
        </a>
      ) : (
        image.license
      )}
      {' - '}
      <a
        className="underline"
        href={image.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        {t('source')}
      </a>
    </p>
  );
}
