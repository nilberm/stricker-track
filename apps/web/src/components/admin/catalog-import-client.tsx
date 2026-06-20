'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { accessTokenKey } from '../../lib/auth';
import {
  executeCatalogImport,
  validateCatalogImport,
  type CatalogImportReport,
} from '../../lib/admin';
import { Link } from '../../i18n/navigation';

export function CatalogImportClient() {
  const t = useTranslations('admin');
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<CatalogImportReport | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'validating' | 'executing' | 'error'
  >('idle');

  async function run(mode: 'validate' | 'dry-run' | 'execute') {
    if (!file) return;
    const token = window.localStorage.getItem(accessTokenKey);
    if (!token) return;
    setStatus(mode === 'execute' ? 'executing' : 'validating');
    try {
      const csv = await file.text();
      const input = { fileName: file.name, csv, dryRun: mode === 'dry-run' };
      const result =
        mode === 'validate'
          ? await validateCatalogImport(token, input)
          : (await executeCatalogImport(token, input)).report;
      setReport(result);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <AdminNavigation />
      <h1 className="mt-6 text-4xl font-black">{t('importsTitle')}</h1>
      <p className="mt-3 text-slate-600">{t('importsDescription')}</p>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
        <label className="block font-bold" htmlFor="catalog-file">
          {t('catalogFile')}
        </label>
        <input
          accept=".csv,text/csv"
          className="mt-3 block w-full rounded-xl border border-slate-300 p-3"
          id="catalog-file"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setReport(null);
          }}
          type="file"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Action
            disabled={!file || status !== 'idle'}
            label={t('validateFile')}
            onClick={() => void run('validate')}
          />
          <Action
            disabled={!file || status !== 'idle'}
            label={t('dryRun')}
            onClick={() => void run('dry-run')}
          />
          <Action
            disabled={
              !file || status !== 'idle' || !report || report.errors.length > 0
            }
            label={t('executeImport')}
            onClick={() => void run('execute')}
            primary
          />
        </div>
        {status === 'error' ? (
          <p className="mt-4 font-bold text-red-700">{t('requestError')}</p>
        ) : null}
      </section>
      {report ? <ImportReport report={report} /> : null}
    </div>
  );
}

export function AdminNavigation() {
  const t = useTranslations('admin');
  return (
    <nav className="flex flex-wrap gap-4 text-sm font-bold text-sky-700">
      <Link href="/admin/players">{t('players')}</Link>
      <Link href="/admin/imports">{t('imports')}</Link>
    </nav>
  );
}

function Action({
  disabled,
  label,
  onClick,
  primary = false,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      className={`rounded-xl px-5 py-3 font-bold disabled:opacity-50 ${
        primary ? 'bg-sky-600 text-white' : 'border border-slate-300 bg-white'
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ImportReport({ report }: { report: CatalogImportReport }) {
  const t = useTranslations('admin');
  const values = [
    [t('totalRows'), report.totalRows],
    [t('validRows'), report.validRows],
    [t('invalidRows'), report.invalidRows],
    [t('createdItems'), report.created.stickers],
    [t('updatedItems'), report.updated.stickers],
    [t('pendingPlayers'), report.created.players],
  ] as const;
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-2xl font-black">{t('importReport')}</h2>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {values.map(([label, value]) => (
          <div className="rounded-xl bg-slate-50 p-4" key={label}>
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="text-2xl font-black">{value}</dd>
          </div>
        ))}
      </dl>
      {report.errors.length ? (
        <ul className="mt-5 grid gap-2 text-sm text-red-700">
          {report.errors.map((error, index) => (
            <li key={`${error.code}-${error.row ?? index}`}>
              {error.row ? `${t('row')} ${error.row}: ` : ''}
              {error.code}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 font-bold text-emerald-700">{t('fileValid')}</p>
      )}
    </section>
  );
}
