import { PlayerImageAttribution } from './player-image-attribution';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      photoBy: 'Photo:',
      unknownAuthor: 'Unknown author',
      license: 'License',
      source: 'Source',
    })[key] ?? key,
}));

describe('PlayerImageAttribution', () => {
  it('renders the author, license, and source links', () => {
    const element = PlayerImageAttribution({
      image: {
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
        author: 'Example Author',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
    });
    const rendered = JSON.stringify(element);

    expect(rendered).toContain('Example Author');
    expect(rendered).toContain('CC BY-SA 4.0');
    expect(rendered).toContain(
      'https://commons.wikimedia.org/wiki/File:Example.jpg',
    );
    expect(rendered).toContain(
      'https://creativecommons.org/licenses/by-sa/4.0/',
    );
  });
});
