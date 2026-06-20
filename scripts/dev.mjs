import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import process from 'node:process';

const rootDirectory = process.cwd();
const environmentPath = `${rootDirectory}/.env`;
const environmentExamplePath = `${rootDirectory}/.env.example`;
const packageManagerPath = process.env.npm_execpath;

function parseEnvironment(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [
          line.slice(0, separator),
          line.slice(separator + 1).replace(/^(['"])(.*)\1$/, '$2'),
        ];
      }),
  );
}

async function loadEnvironment() {
  if (!existsSync(environmentPath)) {
    await copyFile(environmentExamplePath, environmentPath);
    console.log('Created .env from .env.example.');
  }

  const environmentContent = await readFile(environmentPath, 'utf8');
  const values = parseEnvironment(environmentContent);
  const environment = { ...values, ...process.env };
  const databaseUser = encodeURIComponent(
    environment.POSTGRES_USER ?? 'sticker_track',
  );
  const databasePassword = encodeURIComponent(
    environment.POSTGRES_PASSWORD ?? 'sticker_track',
  );
  const databaseName = encodeURIComponent(
    environment.POSTGRES_DB ?? 'sticker_track',
  );
  const databasePort = environment.POSTGRES_PORT ?? '55432';

  environment.DATABASE_URL =
    `postgresql://${databaseUser}:${databasePassword}` +
    `@127.0.0.1:${databasePort}/${databaseName}?schema=public`;

  const synchronizedValues = {
    ...values,
    POSTGRES_PORT: databasePort,
    DATABASE_URL: environment.DATABASE_URL,
  };
  const synchronizedContent = `${Object.entries(synchronizedValues)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')}\n`;

  if (synchronizedContent !== environmentContent.replace(/\r\n/g, '\n')) {
    await writeFile(environmentPath, synchronizedContent, 'utf8');
    console.log('Synchronized local database settings in .env.');
  }

  return environment;
}

function run(command, argumentsList, environment, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd: rootDirectory,
      env: environment,
      shell: false,
      stdio: [
        options.input ? 'pipe' : 'inherit',
        options.capture ? 'pipe' : 'inherit',
        options.capture ? 'pipe' : 'inherit',
      ],
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    if (options.input) {
      child.stdin?.end(options.input);
    }

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${stderr}${command} ${argumentsList.join(' ')} exited with ${code}`,
          ),
        );
      }
    });
  });
}

function runPackageManager(argumentsList, environment) {
  if (packageManagerPath) {
    const isJavaScriptEntry = /\.(?:c?js|mjs)$/i.test(packageManagerPath);
    return isJavaScriptEntry
      ? run(
          process.execPath,
          [packageManagerPath, ...argumentsList],
          environment,
        )
      : run(packageManagerPath, argumentsList, environment);
  }

  return run('pnpm', argumentsList, environment);
}

function runPostgres(argumentsList, environment, options = {}) {
  return run(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'postgres',
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      environment.POSTGRES_USER ?? 'sticker_track',
      '-d',
      environment.POSTGRES_DB ?? 'sticker_track',
      ...argumentsList,
    ],
    environment,
    options,
  );
}

async function applyMigrations(environment) {
  await runPackageManager(['db:migrate:deploy'], environment);
}

async function waitForPostgres(environment) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await run(
        'docker',
        [
          'compose',
          'exec',
          '-T',
          'postgres',
          'pg_isready',
          '-U',
          environment.POSTGRES_USER ?? 'sticker_track',
          '-d',
          environment.POSTGRES_DB ?? 'sticker_track',
        ],
        environment,
        { capture: true },
      );
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error('PostgreSQL did not become ready within 30 seconds.');
}

async function main() {
  const environment = await loadEnvironment();

  if (!existsSync(`${rootDirectory}/node_modules`)) {
    console.log('Installing dependencies...');
    await runPackageManager(['install'], environment);
  }

  console.log('Starting PostgreSQL...');
  await run('docker', ['compose', 'up', '-d', 'postgres'], environment);

  console.log('Waiting for PostgreSQL...');
  await waitForPostgres(environment);

  console.log('Applying database migrations...');
  await applyMigrations(environment);

  console.log('Loading idempotent demonstration data...');
  await runPackageManager(['db:seed'], environment);

  if (process.argv.includes('--setup-only')) {
    console.log('Development setup completed.');
    return;
  }

  console.log('Starting StickerTrack web and API...');
  await runPackageManager(['dev:apps'], environment);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
