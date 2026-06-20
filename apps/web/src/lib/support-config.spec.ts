import { parseSupportUrl } from './support-config';

describe('support configuration', () => {
  it('returns null when the environment variable is missing', () => {
    expect(parseSupportUrl(undefined)).toBeNull();
    expect(parseSupportUrl('   ')).toBeNull();
  });

  it.each([
    'javascript:alert(1)',
    'data:text/plain,support',
    'file:///support',
    'http://buymeacoffee.com/stickertrack',
    'not-a-url',
  ])('rejects an invalid support URL: %s', (url) => {
    expect(parseSupportUrl(url)).toBeNull();
  });

  it('accepts a valid HTTPS Buy Me a Coffee URL', () => {
    expect(parseSupportUrl('https://buymeacoffee.com/stickertrack')).toBe(
      'https://buymeacoffee.com/stickertrack',
    );
  });
});
