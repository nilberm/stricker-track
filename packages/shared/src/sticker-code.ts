export type StickerCodeConfig = {
  pattern?: string | null;
  example?: string | null;
  prefixMinLength?: number | null;
  prefixMaxLength?: number | null;
  numberMinLength?: number | null;
  numberMaxLength?: number | null;
};

export type StickerCodeResolution = {
  normalizedCode: string | null;
  candidates: string[];
  requiresConfirmation: boolean;
};

export type StickerCodeCandidate = {
  rawValue: string;
  normalizedValue: string;
  confidence?: number;
  corrections: string[];
};

const numericCorrections: Record<string, string> = {
  O: '0',
  I: '1',
  L: '1',
  S: '5',
  B: '8',
};

const prefixCorrections: Record<string, string[]> = {
  '0': ['O'],
  '1': ['I', 'L'],
  '5': ['S'],
  '8': ['B'],
};

export function normalizeStickerCode(
  input: string,
  config: StickerCodeConfig = {},
): string | null {
  const result = resolveStickerCode(input, config);
  return result.requiresConfirmation ? null : result.normalizedCode;
}

export function resolveStickerCode(
  input: string,
  config: StickerCodeConfig = {},
): StickerCodeResolution {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return invalidResolution();

  const parts = trimmed.split(/[^A-Z0-9]+/).filter(Boolean);
  if (parts.length === 2) {
    const prefixOptions = correctPrefix(parts[0]);
    const number = correctNumber(parts[1]);
    if (!prefixOptions.length || !number) return invalidResolution();

    const candidates = [
      ...new Set(
        prefixOptions
          .map((prefix) => buildCandidate(prefix, number, config))
          .filter((candidate): candidate is string => Boolean(candidate)),
      ),
    ];
    if (!candidates.length) return invalidResolution();

    return {
      normalizedCode: candidates.length === 1 ? candidates[0] : null,
      candidates,
      requiresConfirmation: candidates.length > 1,
    };
  }

  const compact = trimmed.replace(/[^A-Z0-9]/g, '');
  
  if (compact === '00') {
    return {
      normalizedCode: '00',
      candidates: ['00'],
      requiresConfirmation: false,
    };
  }

  const exactMatch = compact.match(/^([A-Z]+)(\d+)$/);
  if (!exactMatch) return invalidResolution();

  const candidate = buildCandidate(exactMatch[1], exactMatch[2], config);
  return candidate
    ? {
        normalizedCode: candidate,
        candidates: [candidate],
        requiresConfirmation: false,
      }
    : invalidResolution();
}

export function extractStickerCodeCandidates(
  rawText: string,
  config: StickerCodeConfig = {},
  knownPrefixes: readonly string[] = [],
): StickerCodeCandidate[] {
  const prefixMin = config.prefixMinLength ?? 2;
  const prefixMax = config.prefixMaxLength ?? 5;
  const numberMin = config.numberMinLength ?? 1;
  const numberMax = config.numberMaxLength ?? 4;
  const candidateMap = new Map<string, StickerCodeCandidate>();
  const segments = rawText
    .toUpperCase()
    .split(/[\r\n]+/)
    .flatMap(
      (line) =>
        line.match(/[A-Z]{2,5}(?:\s*[-.]?\s*[0-9OILSB]{1,4}|[0-9]{1,4})/g) ??
        [],
    );

  for (const segment of segments) {
    const compact = segment.replace(/[^A-Z0-9]/g, '');
    const separators = /[^A-Z0-9]/.test(segment);
    const splitPoints = separators
      ? [segment.search(/[^A-Z0-9]/)]
      : Array.from(
          { length: prefixMax - prefixMin + 1 },
          (_, index) => prefixMin + index,
        );

    for (const splitPoint of splitPoints) {
      const parts = separators
        ? segment.split(/[^A-Z0-9]+/).filter(Boolean)
        : [compact.slice(0, splitPoint), compact.slice(splitPoint)];
      if (parts.length !== 2) continue;

      const [rawPrefix, rawNumber] = parts;
      if (
        rawPrefix.length < prefixMin ||
        rawPrefix.length > prefixMax ||
        rawNumber.length < numberMin ||
        rawNumber.length > numberMax ||
        !/[A-Z]/.test(rawPrefix) ||
        !/\d/.test(rawNumber)
      ) {
        continue;
      }

      const resolution = resolveStickerCode(
        `${rawPrefix} ${rawNumber}`,
        config,
      );
      for (const normalizedValue of resolution.candidates) {
        const normalizedPrefix = normalizedValue.match(/^[A-Z]+/)?.[0];
        if (
          knownPrefixes.length &&
          (!normalizedPrefix || !knownPrefixes.includes(normalizedPrefix))
        ) {
          continue;
        }
        const corrections = describeCorrections(rawPrefix, rawNumber);
        const rawValue = `${rawPrefix} ${rawNumber}`;
        const current = candidateMap.get(normalizedValue);
        if (!current || corrections.length < current.corrections.length) {
          candidateMap.set(normalizedValue, {
            rawValue,
            normalizedValue,
            corrections,
          });
        }
      }
    }
  }

  if (knownPrefixes.length) {
    const partialPattern =
      /(?:^|[^A-Z0-9])([A-Z]{1,4})\s*[-.]?\s*([0-9OILSB]{1,4})(?=$|[^A-Z0-9])/g;
    for (const match of rawText.toUpperCase().matchAll(partialPattern)) {
      const [, rawPrefix, rawNumber] = match;
      if (
        rawPrefix.length >= prefixMin ||
        rawNumber.length < Math.max(2, numberMin) ||
        rawNumber.length > numberMax ||
        !/\d/.test(rawNumber)
      ) {
        continue;
      }
      const correctedNumber = correctNumber(rawNumber);
      if (!correctedNumber) continue;

      for (const knownPrefix of knownPrefixes) {
        if (
          knownPrefix.length < prefixMin ||
          knownPrefix.length > prefixMax ||
          !knownPrefix.endsWith(rawPrefix)
        ) {
          continue;
        }
        const normalizedValue = buildCandidate(
          knownPrefix,
          correctedNumber,
          config,
        );
        if (!normalizedValue || candidateMap.has(normalizedValue)) continue;
        candidateMap.set(normalizedValue, {
          rawValue: `${rawPrefix} ${rawNumber}`,
          normalizedValue,
          corrections: [
            `${rawPrefix}->${knownPrefix}`,
            ...describeCorrections('', rawNumber),
          ].slice(0, 4),
        });
      }
    }
  }

  return [...candidateMap.values()].slice(0, 10);
}

function correctPrefix(value: string) {
  let options = [''];
  for (const character of value) {
    const replacements = /[A-Z]/.test(character)
      ? [character]
      : prefixCorrections[character];
    if (!replacements) return [];
    options = options.flatMap((prefix) =>
      replacements.map((replacement) => `${prefix}${replacement}`),
    );
  }
  return options;
}

function correctNumber(value: string) {
  let result = '';
  for (const character of value) {
    if (/\d/.test(character)) {
      result += character;
      continue;
    }
    const replacement = numericCorrections[character];
    if (!replacement) return null;
    result += replacement;
  }
  return result;
}

function buildCandidate(
  prefix: string,
  rawNumber: string,
  config: StickerCodeConfig,
) {
  const prefixMin = config.prefixMinLength ?? 2;
  const prefixMax = config.prefixMaxLength ?? 5;
  const numberMin = config.numberMinLength ?? 1;
  const numberMax = config.numberMaxLength ?? 4;
  if (
    prefix.length < prefixMin ||
    prefix.length > prefixMax ||
    rawNumber.length < numberMin ||
    rawNumber.length > numberMax
  ) {
    return null;
  }
  return `${prefix}${Number(rawNumber)}`;
}

function describeCorrections(rawPrefix: string, rawNumber: string) {
  const corrections: string[] = [];
  for (const character of rawPrefix) {
    const replacements = prefixCorrections[character];
    if (replacements) {
      corrections.push(`${character}->${replacements.join('|')}`);
    }
  }
  for (const character of rawNumber) {
    const replacement = numericCorrections[character];
    if (replacement) corrections.push(`${character}->${replacement}`);
  }
  return corrections.slice(0, 4);
}

function invalidResolution(): StickerCodeResolution {
  return {
    normalizedCode: null,
    candidates: [],
    requiresConfirmation: false,
  };
}
