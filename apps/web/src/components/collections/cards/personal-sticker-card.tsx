import { useTranslations } from 'next-intl';
import type { PersonalStickerPage } from '../../../lib/personal-collections';
import { useStickerQuantityMutation } from '../../../hooks/use-personal-collection';
import { Avatar } from '../../catalog/avatar';
import { Check, Copy, Minus, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function PersonalStickerCard({
  sticker,
  token,
  userCollectionId,
}: {
  sticker: PersonalStickerPage['data'][number];
  token: string;
  userCollectionId: string;
}) {
  const t = useTranslations();
  const mutation = useStickerQuantityMutation(userCollectionId, token);
  
  const displayName = sticker.player?.displayName ?? sticker.player?.name ?? sticker.name;
  const isMissing = sticker.quantity === 0;
  const isGlued = sticker.quantity >= 1;
  const hasExtras = sticker.quantity > 1;
  const extrasCount = sticker.quantity - 1;
  const isTeam = sticker.type === 'TEAM';
  const isFoil = (sticker.type === 'BADGE' || sticker.type === 'SPECIAL') && isGlued;

  let baseClass = 'group relative flex flex-col rounded-xl transition-all p-2 focus-within:ring-2 focus-within:ring-amber-500/50';
  
  if (isTeam) {
    baseClass += ' col-span-2 aspect-[3/2]';
  } else {
    baseClass += ' col-span-1 aspect-[3/4]';
  }

  // Desloca a carta principal levemente com base na quantidade de cópias na pilha para manter o alinhamento central
  if (hasExtras) {
    if (extrasCount >= 3) baseClass += ' -translate-x-1.5 -translate-y-1.5';
    else if (extrasCount === 2) baseClass += ' -translate-x-1 -translate-y-1';
    else baseClass += ' -translate-x-0.5 -translate-y-0.5';
  }

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleDecrement() {
    if (sticker.quantity === 1) {
      setShowConfirmModal(true);
      return;
    }
    mutation.mutate({ stickerId: sticker.id, direction: 'decrement' });
  }

  function confirmDecrement() {
    setShowConfirmModal(false);
    mutation.mutate({ stickerId: sticker.id, direction: 'decrement' });
  }

  return (
    <article className={baseClass} style={{ transformStyle: 'preserve-3d' }}>
      {/* Cartas empilhadas no fundo (progressivas, até 3 camadas) */}
      {hasExtras && (
        <>
          {extrasCount >= 3 && (
            <div className="absolute inset-0 -z-30 translate-x-3 translate-y-3 rounded-xl border border-zinc-900 bg-zinc-950 shadow-sm" />
          )}
          {extrasCount >= 2 && (
            <div className="absolute inset-0 -z-20 translate-x-2 translate-y-2 rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm" />
          )}
          {extrasCount >= 1 && (
            <div className="absolute inset-0 -z-10 translate-x-1 translate-y-1 rounded-xl border border-zinc-700 bg-zinc-800/80 shadow-sm" />
          )}
        </>
      )}

      {/* Background inner wrapper (Carta principal) */}
      <div className={`absolute inset-0 z-0 rounded-xl transition-colors ${isMissing ? 'bg-zinc-900/50 border border-dashed border-zinc-700/50' : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border border-amber-500/40 overflow-hidden'}`}>
        {!isMissing && !hasExtras && <div className="absolute inset-0 shadow-md shadow-black/60" />}
        {isFoil && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent pointer-events-none" />}
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-between">
        
        {/* Top Row: Code and Badge */}
        {isMissing ? (
          <div className="flex w-full justify-between items-start">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{sticker.code}</span>
            <span className="rounded-md border border-zinc-800 bg-zinc-950/80 px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest text-zinc-500 shadow-inner">
              {t(`stickerTypes.${sticker.type}`)}
            </span>
          </div>
        ) : (
          <div className="flex w-full items-start justify-between gap-1">
            <span className="text-xs font-black tracking-wider text-amber-500 drop-shadow-sm">{sticker.code}</span>
            <span className="rounded-md border border-zinc-800 bg-zinc-950/80 px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest text-zinc-400 shadow-inner">
              {t(`stickerTypes.${sticker.type}`)}
            </span>
          </div>
        )}

        {/* Center Area */}
        <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">
          {isMissing ? (
            <span className="text-4xl font-black text-zinc-700/30 group-hover:text-zinc-700/50 transition-colors">{sticker.code}</span>
          ) : (
            <>
              <div className="shrink-0 scale-75 transform origin-center">
                <Avatar imageUrl={sticker.player?.image?.url} name={displayName} />
              </div>
              <h2 className="mt-1 w-full truncate text-center text-[10px] font-black leading-tight text-zinc-100 drop-shadow-md sm:text-xs">
                {sticker.name}
              </h2>
              {sticker.player && sticker.player.name !== sticker.name && (
                <p className="w-full truncate text-center text-[8px] font-semibold tracking-wider text-zinc-400">
                  {sticker.player.name}
                </p>
              )}
            </>
          )}
        </div>

        {/* Bottom Area */}
        <div className="relative w-full h-8 mt-auto flex justify-center items-center">
          {isMissing ? (
            <button
              onClick={() => mutation.mutate({ stickerId: sticker.id, direction: 'increment' })}
              disabled={mutation.isPending}
              aria-label={t('myCollections.increment')}
              className="flex items-center justify-center rounded-full w-8 h-8 bg-zinc-800/30 text-zinc-600 hover:text-amber-500 hover:bg-zinc-800 border border-transparent hover:border-amber-500/30 transition-all focus:outline-none"
            >
              <Check size={18} strokeWidth={3} />
            </button>
          ) : (
            <>
              {/* Default view when collected */}
              {hasExtras && (
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-black text-amber-500 bg-zinc-950/90 px-2.5 py-0.5 rounded border border-amber-500/30 shadow-md">
                  <Copy size={10} />
                  <span>{extrasCount} {extrasCount === 1 ? 'Cópia' : 'Cópias'}</span>
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-zinc-900/90 backdrop-blur-sm rounded-lg scale-95 group-hover:scale-100">
                <button
                  onClick={handleDecrement}
                  disabled={mutation.isPending}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-900/50 bg-zinc-800 text-amber-500 hover:bg-amber-500 hover:text-zinc-900 transition focus:outline-none"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="min-w-[1.5rem] text-center text-xs font-black text-amber-500 drop-shadow-md">
                  {sticker.quantity}
                </span>
                <button
                  onClick={() => mutation.mutate({ stickerId: sticker.id, direction: 'increment' })}
                  disabled={mutation.isPending}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-900/50 bg-zinc-800 text-amber-500 hover:bg-amber-500 hover:text-zinc-900 transition focus:outline-none"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Customizado de Confirmação (Renderizado via Portal) */}
      {showConfirmModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ margin: 0 }}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-xs w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-amber-500 mb-3">Atenção!</h3>
            <p className="text-sm font-semibold text-zinc-300 mb-6 leading-relaxed">
              Esta figurinha já está <span className="text-amber-500">colada</span> no seu álbum.
              <br /><br />
              Deseja realmente removê-la para corrigir um erro?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDecrement}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-amber-950 hover:bg-amber-500 transition shadow-md"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
