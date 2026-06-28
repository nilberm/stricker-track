'use client';

import { useLocale } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/config';
import { usePublicCollections } from '../../hooks/use-public-collections';

export function CommunityClient() {
  const locale = useLocale() as Locale;
  const { data, isLoading, isError } = usePublicCollections(locale);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-xl font-bold text-slate-300 animate-pulse">Carregando coleções...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-2xl border-2 border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          Erro ao carregar a comunidade.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-4">
            Comunidade <span className="text-amber-500">StickerTrack</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Explore coleções públicas, encontre colecionadores e faça trocas incríveis para completar seu álbum.
          </p>
        </header>

        {(!data || data.length === 0) ? (
          <div className="text-center py-20 rounded-3xl border border-white/5 bg-white/[0.02]">
            <span className="text-4xl mb-4 block">🌍</span>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma coleção pública ainda</h3>
            <p className="text-zinc-500">Seja o primeiro a compartilhar sua coleção com o mundo!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <Link
                key={item.id}
                href={`/community/${item.id}`}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:bg-zinc-800 hover:border-amber-500/50"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800 border-2 border-zinc-700 group-hover:border-amber-500 transition-colors">
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-500">
                      {item.user.name ? item.user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">{item.user.name}</h3>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{item.collection.name}</p>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Progresso</span>
                    <span className="text-lg font-black text-amber-500">{item.progress.completionPercentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/50 border border-white/5">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                      style={{ width: `${Math.min(item.progress.completionPercentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Coladas</div>
                      <div className="text-sm font-black text-emerald-400">{item.progress.ownedUnique}</div>
                    </div>
                    <div className="text-center border-l border-r border-white/5">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Faltam</div>
                      <div className="text-sm font-black text-pink-500">{item.progress.missing}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">Repetidas</div>
                      <div className="text-sm font-black text-violet-400">{item.progress.duplicates}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
