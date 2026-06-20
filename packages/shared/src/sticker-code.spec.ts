import {
  extractStickerCodeCandidates,
  normalizeStickerCode,
} from './sticker-code';

describe('normalizeStickerCode', () => {
  it.each([
    ['NTH 01', 'NTH1'],
    ['NTH01', 'NTH1'],
    ['NTH-01', 'NTH1'],
    ['NTH.001', 'NTH1'],
    ['nth 01', 'NTH1'],
    [' NTH 01 ', 'NTH1'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeStickerCode(input)).toBe(expected);
  });

  it.each(['', 'NTH', '001'])('rejects invalid input %s', (input) => {
    expect(normalizeStickerCode(input)).toBeNull();
  });

  it('applies safe numeric corrections contextually', () => {
    expect(normalizeStickerCode('NTH O1')).toBe('NTH1');
  });
});

describe('extractStickerCodeCandidates', () => {
  const config = {
    prefixMinLength: 3,
    prefixMaxLength: 3,
    numberMinLength: 1,
    numberMaxLength: 2,
  };

  it.each([
    ['NTH 01', 'NTH1'],
    ['NTH01', 'NTH1'],
    ['NTH O1', 'NTH1'],
    ['Text before NTH-01 text after', 'NTH1'],
  ])('extracts %s', (rawText, expected) => {
    expect(extractStickerCodeCandidates(rawText, config)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ normalizedValue: expected }),
      ]),
    );
  });

  it('extracts more than one code and removes duplicates', () => {
    const candidates = extractStickerCodeCandidates(
      'NTH 01\nNTH02\nNTH-01',
      config,
    );
    expect(candidates.map(({ normalizedValue }) => normalizedValue)).toEqual([
      'NTH1',
      'NTH2',
    ]);
  });

  it('returns no candidate for unrelated text', () => {
    expect(extractStickerCodeCandidates('LOT 123 OTHER TEXT', config)).toEqual(
      [],
    );
  });

  it('records contextual corrections', () => {
    expect(extractStickerCodeCandidates('NTH O1', config)[0]).toEqual(
      expect.objectContaining({
        normalizedValue: 'NTH1',
        corrections: ['O->0'],
      }),
    );
    expect(extractStickerCodeCandidates('NTH I2', config)[0]).toEqual(
      expect.objectContaining({
        normalizedValue: 'NTH12',
        corrections: ['I->1'],
      }),
    );
  });

  it('does not accept a correction-only number', () => {
    expect(extractStickerCodeCandidates('NTH S', config)).toEqual([]);
  });

  it.each([
    ['NED 19', 'NED19'],
    ['NED19', 'NED19'],
    ['NED I9', 'NED19'],
  ])('normalizes real sticker code %s', (rawText, normalizedValue) => {
    expect(extractStickerCodeCandidates(rawText, config)).toEqual([
      expect.objectContaining({ normalizedValue }),
    ]);
  });

  it('ignores large unrelated title text and prioritizes the code shape', () => {
    expect(
      extractStickerCodeCandidates(
        'FIFA WORLD CUP 2026\nOFFICIAL STICKER\nNED 19',
        config,
      ),
    ).toEqual([expect.objectContaining({ normalizedValue: 'NED19' })]);
  });

  it('keeps only compatible candidates from mixed frame text', () => {
    expect(
      extractStickerCodeCandidates(
        'FIFA 2026\nNED 19\nSERIAL 123456\nNED19',
        config,
      ).map(({ normalizedValue }) => normalizedValue),
    ).toEqual(['NED19']);
  });

  it('discards plausible text with an unknown collection prefix', () => {
    expect(
      extractStickerCodeCandidates('CUP 2026 NED 19', config, ['NED']),
    ).toEqual([expect.objectContaining({ normalizedValue: 'NED19' })]);
    expect(extractStickerCodeCandidates('CUP 2026', config, ['NED'])).toEqual(
      [],
    );
  });

  it('recovers a known prefix when OCR keeps only its final letter', () => {
    const candidates = extractStickerCodeCandidates(
      'D290 B GE 29 B D19 D19 B D9 FIFA WORLD CUP 2026',
      config,
      ['NED'],
    );
    expect(candidates).toEqual([
      expect.objectContaining({
        rawValue: 'D 19',
        normalizedValue: 'NED19',
        corrections: ['D->NED'],
      }),
    ]);
  });

  it('does not recover a partial prefix without collection knowledge', () => {
    expect(extractStickerCodeCandidates('D19', config)).toEqual([]);
  });

  it('does not recover a missing prefix from a single digit', () => {
    expect(extractStickerCodeCandidates('D9', config, ['NED'])).toEqual([]);
  });
});
