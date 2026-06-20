import { GlobalStickersClient } from '../../../../../components/collections/global-stickers-client';

export default async function GlobalStickersPage({
  params,
}: {
  params: Promise<{ userCollectionId: string }>;
}) {
  const { userCollectionId } = await params;
  return <GlobalStickersClient userCollectionId={userCollectionId} />;
}
