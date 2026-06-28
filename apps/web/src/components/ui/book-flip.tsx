'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { PageFlip } from 'page-flip';

export interface BookFlipProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  showCover?: boolean;
  onFlip?: (flipEvent: { data: number }) => void;
  className?: string;
  style?: React.CSSProperties;
  startPage?: number;
}

export const BookFlip = forwardRef((props: BookFlipProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);

  useEffect(() => {
    if (containerRef.current && !pageFlipRef.current) {
      // Cria a instância do StPageFlip
      const pageFlip = new PageFlip(containerRef.current, {
        width: props.width || 550,
        height: props.height || 733, // proporção 3:4 padrão
        size: 'stretch',
        minWidth: props.minWidth || 315,
        maxWidth: props.maxWidth || 1000,
        minHeight: props.minHeight || 420,
        maxHeight: props.maxHeight || 1350,
        drawShadow: true,
        showCover: props.showCover || false,
        usePortrait: true, // modo single page no mobile
        startPage: props.startPage || 0,
        maxShadowOpacity: 0.5,
        showPageCorners: true,
        disableFlipByClick: false,
      });

      pageFlipRef.current = pageFlip;

      // Carrega os filhos diretos como páginas
      const pages = Array.from(containerRef.current.children) as HTMLElement[];
      if (pages.length > 0) {
        pageFlip.loadFromHTML(pages);
      }

      if (props.onFlip) {
        pageFlip.on('flip', (e) => props.onFlip?.(e));
      }
    }

    return () => {
      if (pageFlipRef.current) {
        pageFlipRef.current.destroy();
        pageFlipRef.current = null;
      }
    };
  }, []); // Monta apenas uma vez

  useImperativeHandle(ref, () => ({
    pageFlip: () => pageFlipRef.current,
    turnToPage: (page: number) => {
      if (pageFlipRef.current) {
        pageFlipRef.current.turnToPage(page);
      }
    }
  }));

  return (
    <div className={props.className} style={props.style}>
      <div ref={containerRef}>
        {props.children}
      </div>
    </div>
  );
});
BookFlip.displayName = 'BookFlip';

export const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode, number?: number, className?: string }>((props, ref) => {
  return (
    <div className={`page-flip-page ${props.className || ''}`} ref={ref}>
      <div className="h-full w-full overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-inner p-4 lg:p-8 flex flex-col">
        <div className="flex-1 relative">
           {props.children}
        </div>
        {props.number !== undefined && (
          <div className="absolute bottom-4 left-0 w-full text-center text-[10px] lg:text-xs font-bold text-zinc-600">
            {props.number}
          </div>
        )}
      </div>
    </div>
  );
});
BookPage.displayName = 'BookPage';
