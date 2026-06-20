import { AdminAccess } from '../../../../components/admin/admin-access';
import { AdminPlayersClient } from '../../../../components/admin/admin-players-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminPlayersPage() {
  return (
    <Suspense>
      <AdminAccess>
        <AdminPlayersClient />
      </AdminAccess>
    </Suspense>
  );
}
