'use client';

import { useTranslations } from 'next-intl';
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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 font-black text-amber-950 shadow-md shadow-black/30 transition hover:scale-105 hover:bg-amber-500 hover:shadow-amber-500/20"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-700 bg-zinc-800 py-1 shadow-xl z-50">
          <Link
            href="/profile"
            className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-300 transition hover:bg-zinc-700 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            {tNav('profile')}
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-400 transition hover:bg-zinc-700 hover:text-red-300"
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
            className="hidden text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:text-amber-500 sm:block"
            href="/dashboard"
          >
            {t('navigation.dashboard')}
          </Link>
          <Link
            className="hidden text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:text-amber-500 sm:block"
            href="/my-collections"
          >
            {t('navigation.myCollections')}
          </Link>
          {user?.role === 'ADMIN' ? (
            <>
              <Link
                className="hidden text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:text-amber-500 sm:block"
                href="/community"
              >
                {t('community.title')}
              </Link>
              <Link
                className="hidden text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:text-amber-500 sm:block"
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
            className="hidden text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition hover:text-zinc-100 sm:block"
            href="/login"
          >
            {t('navigation.login')}
          </Link>
          <Link
            className="hidden rounded-xl bg-amber-600 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-amber-950 shadow transition hover:bg-amber-500 sm:block"
            href="/register"
          >
            {t('navigation.register')}
          </Link>
        </>
      ) : null}
      <LanguageSwitcher />
    </nav>
  );
}
