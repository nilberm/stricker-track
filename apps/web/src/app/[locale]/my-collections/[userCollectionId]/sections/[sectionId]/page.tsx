import { SectionDetailClient } from '../../../../../../components/collections/section-detail-client';

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ userCollectionId: string; sectionId: string }>;
}) {
  const { userCollectionId, sectionId } = await params;
  return <SectionDetailClient userCollectionId={userCollectionId} sectionId={sectionId} />;
}
