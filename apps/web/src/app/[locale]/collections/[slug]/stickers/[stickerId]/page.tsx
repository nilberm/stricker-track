import { StickerDetailClient } from '../../../../../../components/catalog/sticker-detail-client';

export default async function StickerDetailPage({
  params,
}: {
  params: Promise<{ slug: string; stickerId: string }>;
}) {
  const { slug, stickerId } = await params;
  return <StickerDetailClient slug={slug} stickerId={stickerId} />;
}
