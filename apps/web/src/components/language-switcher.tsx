'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { apiRequest } from '../lib/api';
import { accessTokenKey } from '../lib/auth';
import { locales, type Locale } from '../i18n/config';

import { useState, useRef, useEffect } from 'react';

const localeConfig: Record<Locale, { label: string, flag: string, activeBg: string, activeText: string }> = {
  'pt-BR': { label: 'PT', flag: 'br', activeBg: 'bg-emerald-400', activeText: 'text-zinc-900' },
  en: { label: 'EN', flag: 'us', activeBg: 'bg-red-500', activeText: 'text-white' },
  es: { label: 'ES', flag: 'es', activeBg: 'bg-yellow-400', activeText: 'text-zinc-900' },
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
        className="flex h-10 items-center gap-2 border-2 border-zinc-900 bg-zinc-200 px-3 text-xs font-black tracking-widest text-zinc-900 shadow-[4px_4px_0px_#18181b] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#18181b] focus:outline-none"
      >
        <img 
          src={`https://flagcdn.com/w20/${currentConfig.flag}.png`} 
          alt={currentConfig.label} 
          className="h-3 w-4 border border-zinc-900 object-cover" 
        />
        <span>{currentConfig.label}</span>
        <svg className={`h-3 w-3 fill-current transition-all ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-28 border-2 border-zinc-900 bg-white shadow-[6px_6px_0px_#18181b] z-50 flex flex-col overflow-hidden">
          {locales.map((supportedLocale: Locale, index) => {
            const config = localeConfig[supportedLocale];
            const isSelected = supportedLocale === locale;
            return (
              <button
                key={supportedLocale}
                onClick={() => handleSelect(supportedLocale)}
                className={`group flex w-full items-center gap-2 px-3 py-3 text-left text-xs font-black tracking-widest transition ${
                  index !== 0 ? 'border-t-2 border-zinc-900' : ''
                } ${
                  isSelected ? `${config.activeBg} ${config.activeText}` : 'bg-white text-zinc-900 hover:bg-zinc-200'
                }`}
              >
                <img 
                  src={`https://flagcdn.com/w20/${config.flag}.png`} 
                  alt={config.label} 
                  className={`h-3 w-4 border border-zinc-900 object-cover transition-all group-hover:scale-110 ${isSelected ? 'opacity-100 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]' : 'opacity-100'}`} 
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
