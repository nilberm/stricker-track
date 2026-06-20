import { AdminAccess } from '../../../../../components/admin/admin-access';
import { AdminPlayerDetailClient } from '../../../../../components/admin/admin-player-detail-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function AdminPlayerPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  return (
    <Suspense>
      <AdminAccess>
        <AdminPlayerDetailClient playerId={playerId} />
      </AdminAccess>
    </Suspense>
  );
}
