'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { authenticatedApiRequest } from '../../lib/api';
import { accessTokenKey, type AuthUser } from '../../lib/auth';
import { Link } from '../../i18n/navigation';

export function AdminAccess({ children }: { children: ReactNode }) {
  const t = useTranslations('admin');
  const [status, setStatus] = useState<'loading' | 'allowed' | 'unauthorized'>(
    'loading',
  );

  useEffect(() => {
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) {
      setStatus('unauthorized');
      return;
    }
    void authenticatedApiRequest<AuthUser>('/auth/me', token)
      .then((user) =>
        setStatus(user.role === 'ADMIN' ? 'allowed' : 'unauthorized'),
      )
      .catch(() => setStatus('unauthorized'));
  }, []);

  if (status === 'loading') {
    return <AdminState text={t('loading')} />;
  }
  if (status === 'unauthorized') {
    return (
      <AdminState text={t('accessDenied')}>
        <Link className="font-bold text-sky-700" href="/dashboard">
          {t('backToDashboard')}
        </Link>
      </AdminState>
    );
  }
  return children;
}

function AdminState({
  children,
  text,
}: {
  children?: ReactNode;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-center">
      <p className="font-semibold text-slate-600">{text}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
