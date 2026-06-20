import { parseSupportUrl } from '../lib/support-config';
import {
  isRestrictedSupportRoute,
  SupportProjectButton,
} from './support-project-button';

let pathname = '/pt-BR/support';

jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      button: 'Support StickerTrack',
      buttonAriaLabel: 'Support StickerTrack in a new tab',
    })[key] ?? key,
}));

describe('SupportProjectButton', () => {
  it('is hidden when the URL is missing or invalid', () => {
    expect(SupportProjectButton({ url: null })).toBeNull();
    expect(
      SupportProjectButton({
        url: parseSupportUrl('javascript:alert(1)'),
      }),
    ).toBeNull();
  });

  it('renders a safe external link for a valid URL', () => {
    const element = SupportProjectButton({
      url: 'https://buymeacoffee.com/stickertrack',
    });

    expect(element?.type).toBe('a');
    expect(element?.props).toMatchObject({
      href: 'https://buymeacoffee.com/stickertrack',
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'Support StickerTrack in a new tab',
    });
  });

  it('is hidden on scanner, login, and registration routes', () => {
    for (const route of [
      '/pt-BR/my-collections/id/scan',
      '/en/login',
      '/es/register',
    ]) {
      pathname = route;
      expect(
        SupportProjectButton({
          hideOnRestrictedRoutes: true,
          url: 'https://buymeacoffee.com/stickertrack',
        }),
      ).toBeNull();
      expect(isRestrictedSupportRoute(route)).toBe(true);
    }
  });
});
