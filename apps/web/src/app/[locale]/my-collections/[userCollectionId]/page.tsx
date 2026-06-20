import { CollectionOverviewClient } from '../../../../components/collections/collection-overview-client';

export default async function PersonalCollectionPage({
  params,
}: {
  params: Promise<{ userCollectionId: string }>;
}) {
  const { userCollectionId } = await params;
  return <CollectionOverviewClient userCollectionId={userCollectionId} />;
}
