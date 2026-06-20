'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { apiRequest } from '../lib/api';
import { accessTokenKey } from '../lib/auth';
import { locales, type Locale } from '../i18n/config';

import { useState, useRef, useEffect } from 'react';

const localeConfig: Record<Locale, { label: string, flag: string }> = {
  'pt-BR': { label: 'PT', flag: 'br' },
  en: { label: 'EN', flag: 'us' },
  es: { label: 'ES', flag: 'es' },
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();

  async function changeLocale(nextLocale: Locale) {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;

    const token = window.localStorage.getItem(accessTokenKey);
    if (token) {
      await apiRequest('/users/me/preferences', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferredLocale: nextLocale }),
      }).catch(() => undefined);
    }

    const segments = pathname.split('/');
    segments[1] = nextLocale;
    const query = searchParams.toString();
    router.replace(`${segments.join('/')}${query ? `?${query}` : ''}`);
  }

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  async function handleSelect(nextLocale: Locale) {
    setIsOpen(false);
    if (nextLocale === locale) return;
    await changeLocale(nextLocale);
  }

  const currentConfig = localeConfig[locale] || localeConfig['en'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.language')}
        className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-1.5 text-[11px] font-bold tracking-widest text-amber-500/80 outline-none transition hover:bg-zinc-800 hover:text-amber-400 focus:border-amber-900/50"
      >
        <img 
          src={`https://flagcdn.com/w20/${currentConfig.flag}.png`} 
          alt={currentConfig.label} 
          className="h-3 w-4 object-cover rounded-[1px] opacity-80" 
        />
        <span>{currentConfig.label}</span>
        <svg className={`h-3 w-3 fill-current transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-28 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/50 z-50">
          {locales.map((supportedLocale: Locale) => {
            const config = localeConfig[supportedLocale];
            const isSelected = supportedLocale === locale;
            return (
              <button
                key={supportedLocale}
                onClick={() => handleSelect(supportedLocale)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-bold tracking-widest transition hover:bg-zinc-800 ${
                  isSelected ? 'text-amber-500 bg-zinc-800/50' : 'text-zinc-400 hover:text-amber-400'
                }`}
              >
                <img 
                  src={`https://flagcdn.com/w20/${config.flag}.png`} 
                  alt={config.label} 
                  className={`h-3 w-4 object-cover rounded-[1px] ${isSelected ? 'opacity-100' : 'opacity-60'}`} 
                />
                {config.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
