import { CollectionCatalogClient } from '../../../../components/catalog/collection-catalog-client';

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CollectionCatalogClient slug={slug} />;
}
