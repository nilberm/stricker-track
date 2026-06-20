import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SupportPage from './page';

jest.mock('next-intl/server', () => ({
  getTranslations: () => Promise.resolve((key: string) => `translated:${key}`),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `translated:${key}`,
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/en/support',
}));

jest.mock('../../../i18n/navigation', () => ({
  Link: 'a',
}));

describe('support page', () => {
  it('loads without third-party scripts or iframes', async () => {
    const page = await SupportPage();
    const rendered = JSON.stringify(page);

    expect(rendered).toContain('translated:title');
    expect(rendered).toContain('translated:independenceNotice');
    expect(rendered).not.toContain('<script');
    expect(rendered).not.toContain('<iframe');
  });

  it('does not add support UI to the scanner', () => {
    const scannerSource = readFileSync(
      resolve('src/components/scanner/scanner-client.tsx'),
      'utf8',
    );

    expect(scannerSource).not.toContain('SupportProject');
    expect(scannerSource).not.toContain('buymeacoffee');
  });
});
