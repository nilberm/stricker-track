'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { useEffect, useState, useRef } from 'react';
import { Link, useRouter } from '../i18n/navigation';
import { accessTokenKey, authStateEvent, notifyAuthStateChanged } from '../lib/auth';
import type { AuthUser } from '../lib/auth';
import { authenticatedApiRequest } from '../lib/api';
import { LanguageSwitcher } from './language-switcher';

function AvatarDropdown({ user }: { user: AuthUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const tNav = useTranslations('navigation');
  const tProfile = useTranslations('profile');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    window.localStorage.removeItem(accessTokenKey);
    notifyAuthStateChanged();
    router.replace('/login');
    setIsOpen(false);
  };

  const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center border-2 border-zinc-900 bg-amber-400 font-black text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-48 border-2 border-zinc-900 bg-white shadow-[6px_6px_0px_#18181b] z-50">
          <Link
            href="/profile"
            className="block w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-zinc-900 transition hover:bg-zinc-200"
            onClick={() => setIsOpen(false)}
          >
            {tNav('profile')}
          </Link>
          <div className="border-t-2 border-zinc-900"></div>
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-100"
          >
            {tProfile('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

export function HeaderNavigation() {
  const t = useTranslations();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function updateAuthentication() {
      const token = window.localStorage.getItem(accessTokenKey);
      setIsAuthenticated(Boolean(token));
      setUser(null);
      if (token) {
        void authenticatedApiRequest<AuthUser>('/auth/me', token)
          .then((u) => setUser(u))
          .catch(() => {
            window.localStorage.removeItem(accessTokenKey);
            setIsAuthenticated(false);
            setUser(null);
            notifyAuthStateChanged();
          });
      }
    }

    updateAuthentication();
    window.addEventListener('storage', updateAuthentication);
    window.addEventListener(authStateEvent, updateAuthentication);
    return () => {
      window.removeEventListener('storage', updateAuthentication);
      window.removeEventListener(authStateEvent, updateAuthentication);
    };
  }, []);

  return (
    <nav className="flex items-center gap-3">
      {isAuthenticated === true ? (
        <>
          <Link
            className="hidden sm:flex items-center h-10 border-2 border-zinc-900 bg-red-500 px-4 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
            href="/"
          >
            Hub
          </Link>
          <Link
            className="hidden sm:flex items-center h-10 border-2 border-zinc-900 bg-white px-4 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
            href="/my-collections"
          >
            {t('navigation.myCollections')}
          </Link>
          {user?.role === 'ADMIN' ? (
            <>
              <Link
                className="hidden sm:flex items-center h-10 border-2 border-zinc-900 bg-white px-4 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
                href="/community"
              >
                {t('community.title')}
              </Link>
              <Link
                className="hidden sm:flex items-center h-10 border-2 border-zinc-900 bg-white px-4 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
                href="/admin/players"
              >
                {t('admin.players')}
              </Link>
            </>
          ) : null}
          {user && <AvatarDropdown user={user} />}
        </>
      ) : isAuthenticated === false ? (
        <>
          <Link
            className="hidden sm:flex items-center h-10 border-2 border-zinc-900 bg-white px-4 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
            href="/login"
          >
            {t('navigation.login')}
          </Link>
          <Link
            className="hidden sm:flex items-center h-10 border-2 border-zinc-900 bg-amber-400 px-4 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b]"
            href="/register"
          >
            {t('navigation.register')}
          </Link>
        </>
      ) : null}
      <Suspense fallback={<div className="w-12 h-10 bg-zinc-200 border-2 border-zinc-900 animate-pulse" />}>
        <LanguageSwitcher />
      </Suspense>
    </nav>
  );
}
