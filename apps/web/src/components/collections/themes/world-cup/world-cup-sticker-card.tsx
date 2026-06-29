'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useStickerQuantityMutation } from '../../../../hooks/use-personal-collection';
import type { PersonalStickerPage } from '../../../../lib/personal-collections';

export function WorldCupStickerCard({
  sticker,
  userCollectionId,
  token,
}: {
  sticker: PersonalStickerPage['data'][number];
  userCollectionId: string;
  token: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('stickerCard');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCollected = sticker.quantity > 0;
  const mutation = useStickerQuantityMutation(userCollectionId, token);

  const handleAdd = () => {
    mutation.mutate({ stickerId: sticker.id, direction: 'increment' });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sticker.quantity > 0) {
      mutation.mutate({ stickerId: sticker.id, direction: 'decrement', amount: 1 });
    }
  };

  const handleRemoveAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sticker.quantity > 1) {
      setConfirmDelete(true);
      return;
    }
    
    if (sticker.quantity === 1) {
      mutation.mutate({ stickerId: sticker.id, direction: 'decrement', amount: 1 });
      setIsModalOpen(false);
    }
  };

  const isTeam = sticker.type === 'TEAM';
  const isPlayer = sticker.type === 'PLAYER';

  if (!isCollected) {
    const codeParts = sticker.code.split(' ');
    const prefix = codeParts[0];
    const num = codeParts[1];

    return (
      <div 
        onClick={handleAdd}
        className={`relative flex cursor-pointer flex-col items-center justify-between w-full py-3 overflow-hidden border border-[#1a472a]/20 bg-[#e8f0e8]/40 hover:bg-[#d6e5d6]/70 transition-colors ${isTeam ? 'col-span-2 aspect-[3/2]' : 'col-span-1 aspect-[3/4]'}`}
      >
        {/* Background "26" SVG (World Cup 2026 style) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.95] p-2 sm:p-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1327 2048" fill="none" className="w-full h-full text-white drop-shadow-sm">
            <path d="M 52 152 L 39 174 L 29 194 L 17 224 L 16 230 L 12 240 L 10 251 L 8 255 L 8 259 L 4 275 L 4 280 L 3 281 L 3 288 L 2 289 L 2 296 L 1 297 L 1 308 L 0 309 L 0 331 L 310 331 L 311 332 L 310 333 L 290 334 L 289 335 L 261 339 L 216 352 L 174 371 L 146 388 L 128 401 L 109 417 L 76 451 L 50 487 L 29 526 L 17 556 L 16 562 L 12 572 L 10 583 L 8 587 L 8 591 L 4 607 L 4 612 L 3 613 L 2 628 L 1 629 L 1 639 L 0 640 L 0 994 L 1326 994 L 1326 664 L 1017 664 L 1016 663 L 1017 662 L 1024 662 L 1025 661 L 1033 661 L 1034 660 L 1054 658 L 1073 653 L 1077 653 L 1117 640 L 1155 622 L 1178 608 L 1200 592 L 1220 575 L 1238 557 L 1255 537 L 1269 518 L 1284 494 L 1298 466 L 1298 464 L 1305 449 L 1314 422 L 1319 402 L 1320 392 L 1323 380 L 1323 374 L 1324 373 L 1325 351 L 1326 350 L 1326 323 L 1325 322 L 1324 293 L 1323 292 L 1323 285 L 1322 284 L 1321 273 L 1319 267 L 1319 262 L 1306 217 L 1297 197 L 1297 195 L 1286 173 L 1271 148 L 1255 126 L 1237 105 L 1221 89 L 1200 71 L 1175 53 L 1155 41 L 1131 29 L 1129 29 L 1112 21 L 1085 12 L 1081 12 L 1069 8 L 1042 4 L 1041 3 L 1023 2 L 1022 1 L 1005 1 L 1004 0 L 322 0 L 321 1 L 304 1 L 303 2 L 293 2 L 292 3 L 273 5 L 267 7 L 257 8 L 245 12 L 241 12 L 204 25 L 173 40 L 159 48 L 131 67 L 108 86 L 79 116 L 66 132 Z M 49 1209 L 37 1232 L 35 1234 L 34 1238 L 31 1242 L 31 1244 L 26 1253 L 12 1292 L 7 1312 L 4 1332 L 3 1333 L 1 1360 L 0 1361 L 0 1732 L 1 1733 L 1 1746 L 2 1747 L 3 1764 L 4 1765 L 7 1786 L 12 1806 L 22 1836 L 34 1861 L 34 1863 L 43 1880 L 61 1908 L 86 1939 L 116 1968 L 139 1986 L 157 1998 L 178 2009 L 180 2011 L 211 2025 L 241 2035 L 261 2040 L 266 2040 L 267 2041 L 283 2043 L 284 2044 L 302 2045 L 303 2046 L 319 2046 L 320 2047 L 1005 2047 L 1006 2046 L 1034 2045 L 1035 2044 L 1041 2044 L 1042 2043 L 1069 2039 L 1073 2037 L 1084 2035 L 1112 2026 L 1153 2007 L 1181 1990 L 1200 1976 L 1220 1959 L 1246 1932 L 1265 1908 L 1275 1893 L 1291 1865 L 1309 1822 L 1319 1786 L 1322 1765 L 1323 1764 L 1323 1758 L 1324 1757 L 1324 1749 L 1325 1748 L 1326 1707 L 1325 1706 L 1325 1687 L 1324 1686 L 1323 1669 L 1322 1668 L 1321 1657 L 1320 1656 L 1320 1652 L 1314 1626 L 1311 1619 L 1308 1607 L 1306 1604 L 1306 1601 L 1297 1581 L 1297 1579 L 1278 1543 L 1258 1514 L 1237 1489 L 1212 1465 L 1175 1437 L 1151 1423 L 1129 1412 L 1109 1404 L 1077 1394 L 1073 1394 L 1059 1390 L 1034 1387 L 1033 1386 L 1017 1385 L 1016 1384 L 1017 1383 L 1326 1383 L 1324 1345 L 1323 1344 L 1320 1320 L 1319 1319 L 1318 1310 L 1316 1306 L 1315 1298 L 1302 1259 L 1293 1241 L 1293 1239 L 1279 1213 L 1254 1177 L 1224 1144 L 1206 1128 L 1173 1104 L 1147 1089 L 1119 1076 L 1080 1063 L 1076 1063 L 1058 1058 L 1046 1057 L 1045 1056 L 1033 1055 L 1032 1054 L 1021 1054 L 1020 1053 L 306 1053 L 305 1054 L 294 1054 L 293 1055 L 287 1055 L 286 1056 L 263 1059 L 239 1065 L 232 1068 L 229 1068 L 226 1070 L 207 1076 L 189 1085 L 187 1085 L 153 1104 L 121 1127 L 89 1157 L 67 1183 Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Top Code */}
        <div className="relative z-10 flex flex-col items-center justify-center mt-4 sm:mt-5 opacity-90">
           <span className="text-sm sm:text-base font-black uppercase text-zinc-700 leading-none tracking-tighter">{prefix}</span>
           {num && <span className="text-lg sm:text-xl font-black text-zinc-700 leading-none mt-0.5 tracking-tighter">{num}</span>}
        </div>
        
        {/* Bottom Name */}
        <div className="relative z-10 w-full px-1 text-center mb-2 sm:mb-3 opacity-90">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-zinc-700 block truncate">
            {sticker.name || `Sticker ${sticker.code}`}
          </span>
        </div>
      </div>
    );
  }

  // Collected State (Applies to all types)
  const codeParts = sticker.code.split(' ');
  const prefix = codeParts[0];

  return (
    <>
      <div 
        onClick={() => mutation.mutate({ stickerId: sticker.id, direction: 'increment' })}
        className={`group relative flex cursor-pointer flex-col w-full bg-[#13b2b8] shadow-sm border border-[#1a472a]/20 ${isTeam ? 'col-span-2 aspect-[3/2]' : 'col-span-1 aspect-[3/4]'}`}
      >
        {/* Background "26" SVG */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1327 2048" fill="currentColor" className="w-full h-full text-white drop-shadow-sm">
            <path d="M 52 152 L 39 174 L 29 194 L 17 224 L 16 230 L 12 240 L 10 251 L 8 255 L 8 259 L 4 275 L 4 280 L 3 281 L 3 288 L 2 289 L 2 296 L 1 297 L 1 308 L 0 309 L 0 331 L 310 331 L 311 332 L 310 333 L 290 334 L 289 335 L 261 339 L 216 352 L 174 371 L 146 388 L 128 401 L 109 417 L 76 451 L 50 487 L 29 526 L 17 556 L 16 562 L 12 572 L 10 583 L 8 587 L 8 591 L 4 607 L 4 612 L 3 613 L 2 628 L 1 629 L 1 639 L 0 640 L 0 994 L 1326 994 L 1326 664 L 1017 664 L 1016 663 L 1017 662 L 1024 662 L 1025 661 L 1033 661 L 1034 660 L 1054 658 L 1073 653 L 1077 653 L 1117 640 L 1155 622 L 1178 608 L 1200 592 L 1220 575 L 1238 557 L 1255 537 L 1269 518 L 1284 494 L 1298 466 L 1298 464 L 1305 449 L 1314 422 L 1319 402 L 1320 392 L 1323 380 L 1323 374 L 1324 373 L 1325 351 L 1326 350 L 1326 323 L 1325 322 L 1324 293 L 1323 292 L 1323 285 L 1322 284 L 1321 273 L 1319 267 L 1319 262 L 1306 217 L 1297 197 L 1297 195 L 1286 173 L 1271 148 L 1255 126 L 1237 105 L 1221 89 L 1200 71 L 1175 53 L 1155 41 L 1131 29 L 1129 29 L 1112 21 L 1085 12 L 1081 12 L 1069 8 L 1042 4 L 1041 3 L 1023 2 L 1022 1 L 1005 1 L 1004 0 L 322 0 L 321 1 L 304 1 L 303 2 L 293 2 L 292 3 L 273 5 L 267 7 L 257 8 L 245 12 L 241 12 L 204 25 L 173 40 L 159 48 L 131 67 L 108 86 L 79 116 L 66 132 Z M 49 1209 L 37 1232 L 35 1234 L 34 1238 L 31 1242 L 31 1244 L 26 1253 L 12 1292 L 7 1312 L 4 1332 L 3 1333 L 1 1360 L 0 1361 L 0 1732 L 1 1733 L 1 1746 L 2 1747 L 3 1764 L 4 1765 L 7 1786 L 12 1806 L 22 1836 L 34 1861 L 34 1863 L 43 1880 L 61 1908 L 86 1939 L 116 1968 L 139 1986 L 157 1998 L 178 2009 L 180 2011 L 211 2025 L 241 2035 L 261 2040 L 266 2040 L 267 2041 L 283 2043 L 284 2044 L 302 2045 L 303 2046 L 319 2046 L 320 2047 L 1005 2047 L 1006 2046 L 1034 2045 L 1035 2044 L 1041 2044 L 1042 2043 L 1069 2039 L 1073 2037 L 1084 2035 L 1112 2026 L 1153 2007 L 1181 1990 L 1200 1976 L 1220 1959 L 1246 1932 L 1265 1908 L 1275 1893 L 1291 1865 L 1309 1822 L 1319 1786 L 1322 1765 L 1323 1764 L 1323 1758 L 1324 1757 L 1324 1749 L 1325 1748 L 1326 1707 L 1325 1706 L 1325 1687 L 1324 1686 L 1323 1669 L 1322 1668 L 1321 1657 L 1320 1656 L 1320 1652 L 1314 1626 L 1311 1619 L 1308 1607 L 1306 1604 L 1306 1601 L 1297 1581 L 1297 1579 L 1278 1543 L 1258 1514 L 1237 1489 L 1212 1465 L 1175 1437 L 1151 1423 L 1129 1412 L 1109 1404 L 1077 1394 L 1073 1394 L 1059 1390 L 1034 1387 L 1033 1386 L 1017 1385 L 1016 1384 L 1017 1383 L 1326 1383 L 1324 1345 L 1323 1344 L 1320 1320 L 1319 1319 L 1318 1310 L 1316 1306 L 1315 1298 L 1302 1259 L 1293 1241 L 1293 1239 L 1279 1213 L 1254 1177 L 1224 1144 L 1206 1128 L 1173 1104 L 1147 1089 L 1119 1076 L 1080 1063 L 1076 1063 L 1058 1058 L 1046 1057 L 1045 1056 L 1033 1055 L 1032 1054 L 1021 1054 L 1020 1053 L 306 1053 L 305 1054 L 294 1054 L 293 1055 L 287 1055 L 286 1056 L 263 1059 L 239 1065 L 232 1068 L 229 1068 L 226 1070 L 207 1076 L 189 1085 L 187 1085 L 153 1104 L 121 1127 L 89 1157 L 67 1183 Z" />
          </svg>
          </div>
        </div>

        {/* Hover Remove Balloon (Top-Left) */}
        <div 
          className="absolute -top-1.5 -left-1.5 z-30 h-7 w-7 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer border-2 border-white/20"
          onClick={handleRemoveAll}
          title={t('controls.removeCard')}
        >
          ✕
        </div>

        {/* Duplicates Badge (Top-Right) */}
        {sticker.quantity > 1 && (
          <div 
            className="absolute -top-1.5 -right-1.5 z-30 h-7 w-7 bg-[#f59e0b] rounded-full flex items-center justify-center text-zinc-900 text-[10px] font-black shadow-md hover:scale-110 transition-transform border-2 border-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            title={t('controls.manageDuplicates')}
          >
            +{sticker.quantity - 1}
          </div>
        )}

        {/* Generic Silhouette / Icon based on type */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-end pb-4 opacity-80 pointer-events-none">
          {sticker.type === 'BADGE' ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 sm:w-20 sm:h-20 text-[#1a472a]">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          ) : sticker.type === 'TEAM' ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 sm:w-20 sm:h-20 text-[#1a472a]">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          ) : sticker.type === 'FWC' ? (
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 sm:w-20 sm:h-20 text-[#1a472a]">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
             </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 sm:w-20 sm:h-20 text-[#1a472a]">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>

        {/* Bottom Name Pill */}
        <div className="relative z-20 w-[90%] mx-auto mb-2 sm:mb-3">
          <div className="w-full rounded-full bg-[#1a472a]/95 py-0.5 sm:py-1 px-2 border border-white/20 shadow-sm text-center">
            <span className="text-[7px] sm:text-[9px] font-black uppercase text-white block truncate tracking-wide">
              {sticker.name || `Sticker ${sticker.code}`}
            </span>
          </div>
        </div>
      </div>

      {/* Duplicates Management Modal */}
      {isModalOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-[#1f2937] text-white rounded-xl shadow-2xl w-full max-w-sm p-5 flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2">
               <div className="h-8 w-8 bg-[#374151] rounded flex items-center justify-center text-[#f59e0b] font-black border border-[#f59e0b]/30">
                 +
               </div>
               <h3 className="text-lg font-bold">
                 {t('modal.duplicatesOf')} <span className="text-[#f59e0b]">{sticker.code}</span>
               </h3>
            </div>
            <p className="text-sm text-zinc-400 mb-6">{t('modal.trackCopies')}</p>

            <div className="flex items-center justify-center gap-6 mb-8">
              <button 
                onClick={handleRemove}
                disabled={sticker.quantity <= 1}
                className="h-10 w-10 rounded-full border border-zinc-600 flex items-center justify-center text-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <div className="flex flex-col items-center justify-center min-w-[60px]">
                <span className="text-3xl font-black">{sticker.quantity - 1}</span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold -mt-1 text-center leading-tight">
                   {t('modal.extraCopies').split(' ')[0]}<br/>{t('modal.extraCopies').split(' ')[1] || ''}
                </span>
              </div>
              <button 
                onClick={handleAdd}
                className="h-10 w-10 rounded-full border border-zinc-600 flex items-center justify-center text-xl hover:bg-zinc-700 transition-colors"
              >
                +
              </button>
            </div>

            <div className="flex items-center justify-between w-full">
              <button 
                onClick={handleRemoveAll}
                className="text-sm font-bold text-red-500 hover:text-red-400 px-3 py-2 rounded transition-colors hover:bg-red-500/10"
              >
                {t('controls.deleteCard')}
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-[#374151] hover:bg-[#4b5563] text-white font-bold py-2 px-5 rounded-lg transition-colors"
              >
                {t('controls.done')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {confirmDelete && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={(e) => {
             e.stopPropagation();
             setConfirmDelete(false);
          }}
        >
          <div 
            className="bg-[#1f2937] text-white rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col relative border border-red-900/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
               <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-3">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
               </div>
               <h3 className="text-xl font-bold mb-1">{t('alert.title')}</h3>
               <p className="text-sm text-zinc-300">
                 {t.rich('alert.warningText', {
                   quantity: sticker.quantity,
                   code: sticker.code,
                   bold: (chunks) => <strong>{chunks}</strong>,
                   highlight: (chunks) => <span className="text-[#f59e0b] font-bold">{chunks}</span>
                 })}
               </p>
            </div>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2.5 rounded-lg transition-colors"
              >
                {t('controls.cancel')}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  mutation.mutate({ stickerId: sticker.id, direction: 'decrement', amount: sticker.quantity });
                  setIsModalOpen(false);
                  setConfirmDelete(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg transition-colors"
              >
                {t('controls.confirmDeleteAll')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
