const officialSupportHosts = new Set([
  'buymeacoffee.com',
  'www.buymeacoffee.com',
]);

export function parseSupportUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || !url.hostname) return null;

    if (
      process.env.NODE_ENV === 'development' &&
      !officialSupportHosts.has(url.hostname.toLowerCase())
    ) {
      console.warn(
        'NEXT_PUBLIC_BUY_ME_A_COFFEE_URL uses an unrecognized HTTPS host.',
      );
    }

    return url.toString();
  } catch {
    return null;
  }
}

const configuredUrl = process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL;

export const supportConfig = {
  buyMeACoffeeUrl: parseSupportUrl(configuredUrl),
};

if (
  process.env.NODE_ENV === 'development' &&
  configuredUrl?.trim() &&
  !supportConfig.buyMeACoffeeUrl
) {
  console.warn('NEXT_PUBLIC_BUY_ME_A_COFFEE_URL is invalid and was ignored.');
}
