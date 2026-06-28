'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  exportCollectionText,
  importCollectionText,
} from '../../lib/personal-collections';
import { useTranslations } from 'next-intl';

export function TransferModal({
  isOpen,
  onClose,
  userCollectionId,
  token,
  initialTab,
}: {
  isOpen: boolean;
  onClose: () => void;
  userCollectionId: string;
  token: string;
  initialTab?: 'export' | 'import';
}) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('import');
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const t = useTranslations('transferModal');

  useEffect(() => {
    if (!isOpen) {
      setImportText('');
      setStatusMsg('');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleExportTxt = async () => {
    setIsLoading(true);
    try {
      const res = await exportCollectionText(token, userCollectionId);
      const blob = new Blob([res.text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `minha-colecao.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMsg(t('export.downloaded'));
    } catch (e) {
      setStatusMsg(t('export.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCopy = async () => {
    setIsLoading(true);
    try {
      const res = await exportCollectionText(token, userCollectionId);
      await navigator.clipboard.writeText(res.text);
      setStatusMsg(t('export.copied'));
    } catch (e) {
      setStatusMsg(t('export.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setImportText(text);
        setStatusMsg(t('import.fileLoaded'));
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importMutation = useMutation({
    mutationFn: () => importCollectionText(token, userCollectionId, importText),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-collection-progress'] });
      queryClient.invalidateQueries({ queryKey: ['personal-stickers'] });
      setStatusMsg(
        t('import.success', { imported: data.imported, total: data.totalLines })
      );
    },
    onError: () => {
      setStatusMsg(t('import.error'));
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-xl font-black text-slate-100 drop-shadow-md">
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30">
          <button
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'import'
                ? 'border-b-2 border-amber-500 text-amber-500 bg-amber-500/5'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setActiveTab('import')}
          >
            {t('tabs.import')}
          </button>
          <button
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'export'
                ? 'border-b-2 border-amber-500 text-amber-500 bg-amber-500/5'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setActiveTab('export')}
          >
            {t('tabs.export')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'import' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-zinc-400" dangerouslySetInnerHTML={{ __html: t('import.instructions') }} />
              <textarea
                className="h-48 w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 font-mono text-sm text-zinc-300 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                placeholder={t('import.placeholder')}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  {t('import.loadFile')}
                </button>
                <button
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending || !importText.trim()}
                  className="flex-1 rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-amber-950 uppercase tracking-widest transition-colors hover:bg-amber-500 disabled:opacity-50"
                >
                  {importMutation.isPending ? t('import.submitting') : t('import.submit')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 text-center py-6">
              <div className="text-5xl">📄</div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{t('export.title')}</h3>
                <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto">
                  {t('export.description')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                <button
                  onClick={handleExportCopy}
                  disabled={isLoading}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  {t('export.copy')}
                </button>
                <button
                  onClick={handleExportTxt}
                  disabled={isLoading}
                  className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-black text-amber-950 uppercase tracking-widest transition-colors hover:bg-amber-500 disabled:opacity-50"
                >
                  {t('export.download')}
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div className="mt-6 rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 text-center text-sm font-bold text-amber-500">
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
