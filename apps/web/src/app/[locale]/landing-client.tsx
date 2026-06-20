'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '../../i18n/navigation';
import { accessTokenKey } from '../../lib/auth';

export function LandingClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(accessTokenKey);
    if (token) {
      router.replace('/my-collections');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
