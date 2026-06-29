import { RootProvider } from 'fumadocs-ui/provider/next';
import '../global.css';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
});

const translations: Record<string, any> = {
  en: {},
  pt: {
    search: 'Buscar',
    searchNoResult: 'Nenhum resultado',
    toc: 'Nesta página',
    lastUpdate: 'Última atualização',
    chooseLanguage: 'Escolher Idioma',
    nextPage: 'Próxima',
    previousPage: 'Anterior',
  },
};

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html lang={lang} className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          i18n={{
            locale: lang,
            locales: [
              { name: 'English', locale: 'en' },
              { name: 'Português', locale: 'pt' },
            ],
            translations: translations[lang] || {},
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
