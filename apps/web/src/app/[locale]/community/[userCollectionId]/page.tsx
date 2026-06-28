import { PublicCollectionClient } from '../../../../components/community/public-collection-client';

export const metadata = {
  title: 'Coleção Pública - Sticker Track',
};

export default async function PublicCollectionPage({ params }: { params: Promise<{ userCollectionId: string }> }) {
  const { userCollectionId } = await params;
  return <PublicCollectionClient userCollectionId={userCollectionId} />;
}
