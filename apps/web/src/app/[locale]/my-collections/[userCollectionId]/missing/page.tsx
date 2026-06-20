import { FilteredStickersClient } from '../../../../../components/collections/filtered-stickers-client';

export default async function MissingStickersPage({
  params,
}: {
  params: Promise<{ userCollectionId: string }>;
}) {
  const { userCollectionId } = await params;
  return <FilteredStickersClient userCollectionId={userCollectionId} mode="missing" />;
}
