import { useTranslations } from 'next-intl';
import type { PersonalStickerPage } from '../../../lib/personal-collections';
import { useStickerQuantityMutation, useStickerWeightMutation } from '../../../hooks/use-personal-collection';
import { Avatar } from '../../catalog/avatar';
import { Check, Copy, Minus, Plus, ChevronUp, ChevronDown } from 'lucide-react';
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
  const weightMutation = useStickerWeightMutation(userCollectionId, token);
  
  const displayName = sticker.player?.displayName ?? sticker.player?.name ?? sticker.name;
  const isMissing = sticker.quantity === 0;
  const isGlued = sticker.quantity >= 1;
  const hasExtras = sticker.quantity > 1;
  const extrasCount = sticker.quantity - 1;
  const isTeam = sticker.type === 'TEAM';
  const isFoil = (sticker.type === 'BADGE' || sticker.type === 'SPECIAL') && isGlued;

  let baseClass = 'group relative flex flex-col rounded-none transition-all p-2';
  
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
            <div className="absolute inset-0 -z-30 translate-x-3 translate-y-3 border-4 border-zinc-900 bg-emerald-400 shadow-[2px_2px_0px_#18181b]" />
          )}
          {extrasCount >= 2 && (
            <div className="absolute inset-0 -z-20 translate-x-2 translate-y-2 border-4 border-zinc-900 bg-emerald-300 shadow-[2px_2px_0px_#18181b]" />
          )}
          {extrasCount >= 1 && (
            <div className="absolute inset-0 -z-10 translate-x-1 translate-y-1 border-4 border-zinc-900 bg-emerald-200 shadow-[2px_2px_0px_#18181b]" />
          )}
        </>
      )}

      {/* Background inner wrapper (Carta principal) */}
      <div className={`absolute inset-0 z-0 transition-colors ${isMissing ? 'bg-zinc-200 border-4 border-dashed border-zinc-400' : 'bg-white border-4 border-zinc-900 shadow-[4px_4px_0px_#18181b] overflow-hidden'}`}>
        {isFoil && <div className="absolute inset-0 bg-yellow-100 pointer-events-none mix-blend-multiply" />}
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-between">
        
        {/* Top Row: Code and Badge */}
        {isMissing ? (
          <div className="flex w-full justify-between items-start">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{sticker.code}</span>
            <span className="border-2 border-zinc-400 bg-zinc-200 px-1 py-0.5 text-[8px] font-black uppercase tracking-widest text-zinc-500">
              {t(`stickerTypes.${sticker.type}`)}
            </span>
          </div>
        ) : (
          <div className="flex w-full items-start justify-between gap-1">
            <span className="text-xs font-black tracking-wider text-zinc-900 bg-yellow-300 border-2 border-zinc-900 px-1">{sticker.code}</span>
            <span className="border-2 border-zinc-900 bg-zinc-900 px-1 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
              {t(`stickerTypes.${sticker.type}`)}
            </span>
          </div>
        )}

        {/* Center Area */}
        <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">
          {isMissing ? (
            <span className="text-4xl font-black text-zinc-400 group-hover:text-zinc-500 transition-colors">{sticker.code}</span>
          ) : (
            <>
              <div className="shrink-0 scale-75 transform origin-center">
                <Avatar imageUrl={sticker.player?.image?.url} name={displayName} />
              </div>
              <h2 className="mt-1 w-full truncate text-center text-[10px] font-black leading-tight text-zinc-900 sm:text-xs">
                {sticker.name}
              </h2>
              {sticker.player && sticker.player.name !== sticker.name && (
                <p className="w-full truncate text-center text-[8px] font-black tracking-wider text-zinc-600">
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
              className="flex items-center justify-center border-2 border-zinc-400 w-8 h-8 bg-zinc-100 text-zinc-400 hover:text-zinc-900 hover:bg-emerald-300 hover:border-zinc-900 hover:shadow-[2px_2px_0px_#18181b] transition-all focus:outline-none"
            >
              <Check size={18} strokeWidth={3} />
            </button>
          ) : (
            <>
              {/* Default view when collected */}
              {hasExtras && (
                <div className="absolute top-[-250%] right-[-10%] flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-all z-20">
                  <div className="flex items-center gap-1 bg-white border-2 border-zinc-900 p-1 shadow-[2px_2px_0px_#18181b] pointer-events-auto">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); weightMutation.mutate({ stickerId: sticker.id, weight: Math.max(1, sticker.tradeWeight - 1) }); }}
                      disabled={weightMutation.isPending || sticker.tradeWeight <= 1}
                      className="p-0.5 text-zinc-900 hover:bg-emerald-300 disabled:opacity-30 border-2 border-transparent hover:border-zinc-900"
                    >
                      <ChevronDown size={14} strokeWidth={3} />
                    </button>
                    <span className="text-[10px] font-black text-zinc-900 w-12 text-center uppercase tracking-widest">
                      Peso {sticker.tradeWeight}
                    </span>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); weightMutation.mutate({ stickerId: sticker.id, weight: Math.min(99, sticker.tradeWeight + 1) }); }}
                      disabled={weightMutation.isPending}
                      className="p-0.5 text-zinc-900 hover:bg-emerald-300 disabled:opacity-30 border-2 border-transparent hover:border-zinc-900"
                    >
                      <ChevronUp size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}
              {hasExtras && (
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-black text-zinc-900 bg-emerald-300 px-2.5 py-0.5 border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b]">
                  <Copy size={10} strokeWidth={3} />
                  <span>{extrasCount} {extrasCount === 1 ? 'Cópia' : 'Cópias'}</span>
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-white border-4 border-zinc-900 shadow-[4px_4px_0px_#18181b] scale-95 group-hover:scale-100 z-30">
                <button
                  onClick={handleDecrement}
                  disabled={mutation.isPending}
                  className="flex h-6 w-6 items-center justify-center border-2 border-zinc-900 bg-red-400 text-zinc-900 hover:bg-red-500 transition focus:outline-none shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="min-w-[1.5rem] text-center text-xs font-black text-zinc-900">
                  {sticker.quantity}
                </span>
                <button
                  onClick={() => mutation.mutate({ stickerId: sticker.id, direction: 'increment' })}
                  disabled={mutation.isPending}
                  className="flex h-6 w-6 items-center justify-center border-2 border-zinc-900 bg-emerald-400 text-zinc-900 hover:bg-emerald-500 transition focus:outline-none shadow-[2px_2px_0px_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ margin: 0 }}>
          <div className="bg-white border-4 border-zinc-900 max-w-xs w-full p-6 shadow-[8px_8px_0px_#18181b] animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-zinc-900 mb-3 uppercase tracking-widest">Atenção!</h3>
            <p className="text-sm font-black text-zinc-700 mb-6 leading-relaxed">
              Esta figurinha já está <span className="text-zinc-900 bg-emerald-300 px-1 border-2 border-zinc-900">colada</span> no seu álbum.
              <br /><br />
              Deseja realmente removê-la para corrigir um erro?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-black text-zinc-900 border-2 border-zinc-900 bg-zinc-200 hover:bg-zinc-300 transition shadow-[2px_2px_0px_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181b]"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDecrement}
                className="px-4 py-2 text-xs font-black bg-red-400 text-zinc-900 border-2 border-zinc-900 hover:bg-red-500 transition shadow-[2px_2px_0px_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181b]"
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
