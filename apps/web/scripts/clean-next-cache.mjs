import { rm } from 'node:fs/promises';
import path from 'node:path';

const webDirectory = path.resolve(import.meta.dirname, '..');
const nextDirectory = path.resolve(webDirectory, '.next');

if (path.dirname(nextDirectory) !== webDirectory) {
  throw new Error('Refusing to clean a directory outside the web application.');
}

await rm(nextDirectory, { recursive: true, force: true });
