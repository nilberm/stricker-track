import { getTranslations } from 'next-intl/server';
import { HubClient } from './hub-client';

export async function generateMetadata() {
  const t = await getTranslations('home');
  return {
    title: t('title'),
  };
}

export default function HomePage() {
  return <HubClient />;
}
