import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const locales = ['pt-BR', 'en', 'es'];

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === 'object' && entry !== null
      ? flatten(entry, path)
      : [[path, entry]];
  });
}

function placeholders(value) {
  return [...String(value).matchAll(/\{([a-zA-Z][\w]*)/g)]
    .map((match) => match[1])
    .sort();
}

const messages = Object.fromEntries(
  await Promise.all(
    locales.map(async (locale) => [
      locale,
      JSON.parse(await readFile(resolve('messages', `${locale}.json`), 'utf8')),
    ]),
  ),
);

const reference = new Map(flatten(messages['pt-BR']));
const errors = [];

for (const locale of locales) {
  const current = new Map(flatten(messages[locale]));
  for (const [key, value] of reference) {
    if (!current.has(key)) errors.push(`${locale}: missing ${key}`);
    if (String(current.get(key) ?? '').trim() === '') {
      errors.push(`${locale}: empty ${key}`);
    }
    if (
      JSON.stringify(placeholders(value)) !==
      JSON.stringify(placeholders(current.get(key)))
    ) {
      errors.push(`${locale}: incompatible placeholders in ${key}`);
    }
  }
  for (const key of current.keys()) {
    if (!reference.has(key)) errors.push(`${locale}: unexpected ${key}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Translation messages are consistent.');
