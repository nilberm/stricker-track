import type { MetadataRoute } from 'next';
import { locales } from '../i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const paths = ['', '/privacy', '/terms', '/login', '/register'];

  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${appUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path ? 'monthly' : 'weekly',
      priority: path ? 0.6 : 1,
      alternates: {
        languages: Object.fromEntries(
          locales.map((alternateLocale) => [
            alternateLocale,
            `${appUrl}/${alternateLocale}${path}`,
          ]),
        ),
      },
    })),
  );
}
