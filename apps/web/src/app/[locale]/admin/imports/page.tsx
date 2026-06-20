import { AdminAccess } from '../../../../components/admin/admin-access';
import { CatalogImportClient } from '../../../../components/admin/catalog-import-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminImportsPage() {
  return (
    <Suspense>
      <AdminAccess>
        <CatalogImportClient />
      </AdminAccess>
    </Suspense>
  );
}
