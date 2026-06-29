'use client';

import { useTranslations } from 'next-intl';
import { Link } from '../i18n/navigation';
import { HeaderNavigation } from './header-navigation';
import { useThemeStore } from '../stores/theme-store';

function DefaultHeader() {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="h-2 w-full bg-striped-colorful"></div>
      <div className="border-b-4 border-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-900 transition-colors" href="/">
            <span className="h-4 w-2 bg-zinc-900 rounded-full inline-block rotate-12"></span>
            {t('brand.name')}
          </Link>
          <HeaderNavigation />
        </div>
      </div>
    </header>
  );
}

function WorldCupHeader() {
  const t = useTranslations();
  // TODO: Add specific World Cup styling here!
  // For now, it will look like the default but with a different bg color to prove it works.
  return (
    <header className="sticky top-0 z-40 bg-[#2b3088]">
      <div className="h-2 w-full bg-world-cup-stripes"></div>
      <div className="border-b-4 border-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-white transition-colors" href="/">
            WORLD CUP
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1327 2048" fill="currentColor" className="h-7 w-auto text-white drop-shadow-sm">
              <path d="M 52 152 L 39 174 L 29 194 L 17 224 L 16 230 L 12 240 L 10 251 L 8 255 L 8 259 L 4 275 L 4 280 L 3 281 L 3 288 L 2 289 L 2 296 L 1 297 L 1 308 L 0 309 L 0 331 L 310 331 L 311 332 L 310 333 L 290 334 L 289 335 L 261 339 L 216 352 L 174 371 L 146 388 L 128 401 L 109 417 L 76 451 L 50 487 L 29 526 L 17 556 L 16 562 L 12 572 L 10 583 L 8 587 L 8 591 L 4 607 L 4 612 L 3 613 L 2 628 L 1 629 L 1 639 L 0 640 L 0 994 L 1326 994 L 1326 664 L 1017 664 L 1016 663 L 1017 662 L 1024 662 L 1025 661 L 1033 661 L 1034 660 L 1054 658 L 1073 653 L 1077 653 L 1117 640 L 1155 622 L 1178 608 L 1200 592 L 1220 575 L 1238 557 L 1255 537 L 1269 518 L 1284 494 L 1298 466 L 1298 464 L 1305 449 L 1314 422 L 1319 402 L 1320 392 L 1323 380 L 1323 374 L 1324 373 L 1325 351 L 1326 350 L 1326 323 L 1325 322 L 1324 293 L 1323 292 L 1323 285 L 1322 284 L 1321 273 L 1319 267 L 1319 262 L 1306 217 L 1297 197 L 1297 195 L 1286 173 L 1271 148 L 1255 126 L 1237 105 L 1221 89 L 1200 71 L 1175 53 L 1155 41 L 1131 29 L 1129 29 L 1112 21 L 1085 12 L 1081 12 L 1069 8 L 1042 4 L 1041 3 L 1023 2 L 1022 1 L 1005 1 L 1004 0 L 322 0 L 321 1 L 304 1 L 303 2 L 293 2 L 292 3 L 273 5 L 267 7 L 257 8 L 245 12 L 241 12 L 204 25 L 173 40 L 159 48 L 131 67 L 108 86 L 79 116 L 66 132 Z M 49 1209 L 37 1232 L 35 1234 L 34 1238 L 31 1242 L 31 1244 L 26 1253 L 12 1292 L 7 1312 L 4 1332 L 3 1333 L 1 1360 L 0 1361 L 0 1732 L 1 1733 L 1 1746 L 2 1747 L 3 1764 L 4 1765 L 7 1786 L 12 1806 L 22 1836 L 34 1861 L 34 1863 L 43 1880 L 61 1908 L 86 1939 L 116 1968 L 139 1986 L 157 1998 L 178 2009 L 180 2011 L 211 2025 L 241 2035 L 261 2040 L 266 2040 L 267 2041 L 283 2043 L 284 2044 L 302 2045 L 303 2046 L 319 2046 L 320 2047 L 1005 2047 L 1006 2046 L 1034 2045 L 1035 2044 L 1041 2044 L 1042 2043 L 1069 2039 L 1073 2037 L 1084 2035 L 1112 2026 L 1153 2007 L 1181 1990 L 1200 1976 L 1220 1959 L 1246 1932 L 1265 1908 L 1275 1893 L 1291 1865 L 1309 1822 L 1319 1786 L 1322 1765 L 1323 1764 L 1323 1758 L 1324 1757 L 1324 1749 L 1325 1748 L 1326 1707 L 1325 1706 L 1325 1687 L 1324 1686 L 1323 1669 L 1322 1668 L 1321 1657 L 1320 1656 L 1320 1652 L 1314 1626 L 1311 1619 L 1308 1607 L 1306 1604 L 1306 1601 L 1297 1581 L 1297 1579 L 1278 1543 L 1258 1514 L 1237 1489 L 1212 1465 L 1175 1437 L 1151 1423 L 1129 1412 L 1109 1404 L 1077 1394 L 1073 1394 L 1059 1390 L 1034 1387 L 1033 1386 L 1017 1385 L 1016 1384 L 1017 1383 L 1326 1383 L 1324 1345 L 1323 1344 L 1320 1320 L 1319 1319 L 1318 1310 L 1316 1306 L 1315 1298 L 1302 1259 L 1293 1241 L 1293 1239 L 1279 1213 L 1254 1177 L 1224 1144 L 1206 1128 L 1173 1104 L 1147 1089 L 1119 1076 L 1080 1063 L 1076 1063 L 1058 1058 L 1046 1057 L 1045 1056 L 1033 1055 L 1032 1054 L 1021 1054 L 1020 1053 L 306 1053 L 305 1054 L 294 1054 L 293 1055 L 287 1055 L 286 1056 L 263 1059 L 239 1065 L 232 1068 L 229 1068 L 226 1070 L 207 1076 L 189 1085 L 187 1085 L 153 1104 L 121 1127 L 89 1157 L 67 1183 Z" />
            </svg>
          </Link>
          <HeaderNavigation />
        </div>
      </div>
    </header>
  );
}

export function SiteHeader() {
  const activeTheme = useThemeStore((s) => s.activeTheme);

  if (activeTheme === 'world-cup-2026') {
    return <WorldCupHeader />;
  }

  return <DefaultHeader />;
}
