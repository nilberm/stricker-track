'use client';

import { useLocale } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/config';
import { usePublicCollectionDetail } from '../../hooks/use-public-collections';
import { useUserCollections, useCollectionMatch } from '../../hooks/use-personal-collection';
import { accessTokenKey } from '../../lib/auth';

export function PublicCollectionClient({ userCollectionId }: { userCollectionId: string }) {
  const locale = useLocale() as Locale;
  const { data, isLoading, isError } = usePublicCollectionDetail(userCollectionId, locale);
  
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(window.localStorage.getItem(accessTokenKey));
  }, []);

  const { data: userCollections } = useUserCollections(locale, token);

  const visitorCollectionId = useMemo(() => {
    if (!data || !userCollections) return null;
    const match = userCollections.find(c => c.collection.id === data.collection.id);
    return match ? match.id : null;
  }, [data, userCollections]);

  const { data: matchData, isLoading: matchLoading } = useCollectionMatch(
    visitorCollectionId,
    userCollectionId,
    locale,
    token,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-xl font-bold text-slate-300 animate-pulse">Carregando perfil...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-2xl border-2 border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          Coleção não encontrada ou privada.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <header className="mb-8">
          <Link className="text-sm font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400" href="/community">
            ← Voltar para Comunidade
          </Link>
          
          <div className="mt-8 flex items-center gap-6">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-zinc-800 border-4 border-amber-500">
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-500">
                {data.user.name ? data.user.name.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white drop-shadow-md">
                Coleção de {data.user.name}
              </h1>
              <p className="mt-2 text-lg font-bold text-amber-500">
                {data.collection.name}
              </p>
            </div>
          </div>
        </header>

        {!token && (
          <section className="mt-12 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-amber-500 mb-2">Faça login para comparar coleções</h2>
            <p className="text-amber-500/70 mb-6">
              Você precisa estar logado para ver quais figurinhas vocês podem trocar.
            </p>
            <Link href="/login" className="rounded-xl bg-amber-600 px-6 py-3 font-bold text-amber-950 uppercase tracking-widest hover:bg-amber-500 transition-colors">
              Fazer Login
            </Link>
          </section>
        )}

        {token && !visitorCollectionId && userCollections && (
          <section className="mt-12 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Você não coleciona este álbum</h2>
            <p className="text-zinc-400 mb-6">
              Para comparar repetidas e propor trocas, você precisa adicionar a coleção "{data.collection.name}" ao seu perfil.
            </p>
            <Link href={`/collections/${data.collection.slug}`} className="rounded-xl bg-zinc-800 px-6 py-3 font-bold text-zinc-300 uppercase tracking-widest hover:bg-zinc-700 transition-colors">
              Ver Coleção
            </Link>
          </section>
        )}

        {token && visitorCollectionId && (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-3">
              <span>🤝</span> Possíveis Trocas
            </h2>

            {matchLoading ? (
              <div className="text-zinc-500 animate-pulse font-bold">Analisando coleções...</div>
            ) : matchData ? (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Figurinhas que ELE pode me dar */}
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <span>⬇️</span> Eu quero receber ({matchData.targetCanGive.length})
                  </h3>
                  {matchData.targetCanGive.length === 0 ? (
                    <p className="text-sm text-zinc-500">Ele não tem nenhuma repetida que você precise.</p>
                  ) : (
                    <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {matchData.targetCanGive.map(sticker => (
                        <li key={sticker.id} className="flex justify-between items-center rounded-xl bg-zinc-900 p-3 border border-white/5">
                          <div>
                            <span className="font-black text-white mr-2">{sticker.code}</span>
                            <span className="text-zinc-400 text-sm">{sticker.name}</span>
                          </div>
                          {sticker.tradeWeight > 1 && (
                            <span className="rounded-md bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-500">
                              Peso: {sticker.tradeWeight}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Figurinhas que EU posso dar para ele */}
                <div className="rounded-3xl border border-pink-500/20 bg-pink-500/5 p-6">
                  <h3 className="text-lg font-bold text-pink-400 mb-4 flex items-center gap-2">
                    <span>⬆️</span> Eu posso oferecer ({matchData.visitorCanGive.length})
                  </h3>
                  {matchData.visitorCanGive.length === 0 ? (
                    <p className="text-sm text-zinc-500">Você não tem nenhuma repetida que ele precise.</p>
                  ) : (
                    <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {matchData.visitorCanGive.map(sticker => (
                        <li key={sticker.id} className="flex justify-between items-center rounded-xl bg-zinc-900 p-3 border border-white/5">
                          <div>
                            <span className="font-black text-white mr-2">{sticker.code}</span>
                            <span className="text-zinc-400 text-sm">{sticker.name}</span>
                          </div>
                          {sticker.tradeWeight > 1 && (
                            <span className="rounded-md bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-500">
                              Peso: {sticker.tradeWeight}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            {matchData && (matchData.targetCanGive.length > 0 || matchData.visitorCanGive.length > 0) && (
              <div className="mt-8 flex justify-center">
                <button disabled className="rounded-xl bg-amber-600 px-8 py-4 font-black text-amber-950 uppercase tracking-widest opacity-50 cursor-not-allowed transition hover:bg-amber-500 shadow-lg shadow-amber-500/20">
                  Iniciar Negociação (Em Breve)
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
