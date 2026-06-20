import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as cheerio from 'cheerio';
import { stringify } from 'csv-stringify/sync';

const INPUT_FILE = resolve(__dirname, '../../../data/laststicker-source.html');
const OUTPUT_FILE = resolve(__dirname, '../../../data/world-cup-2026-full.csv');

function parseCatalog() {
  console.log('Loading local HTML file...');
  const html = readFileSync(INPUT_FILE, 'utf8');
  const $ = cheerio.load(html);

  const rows: any[] = [];
  let albumOrder = 1;

  // We keep track of sections to auto-generate section orders
  const sectionOrders = new Map<string, number>();
  let currentSectionOrder = 1;

  $('table tr').each((i, row) => {
    const columns = $(row).find('td');
    if (columns.length < 3) return;

    const stickerCode = $(columns[0]).text().trim();
    const stickerName = $(columns[1]).find('a').text().trim() || $(columns[1]).text().trim();
    const sectionName = $(columns[2]).text().trim();

    // FILTER CRÍTICO: Ignore extras and Coca-Cola
    if (!stickerCode) return;
    if (stickerCode.startsWith('CC-') || stickerCode.startsWith('ESP-')) return;
    // Ignore letter-only extra codes like LM, CR, JD. 
    // Legitimate codes are either "00", start with "FWC", or are 3 letters + a number.
    if (!stickerCode.match(/^00$|^FWC\s*\d+$|^[A-Z]{3}\s*\d+$/)) {
      // It might be a base code without space like MEX19
      if (!stickerCode.match(/^[A-Z]{3}\d+$/)) {
        return; // Exclude
      }
    }

    let sectionCode = '';
    let sectionType = '';
    let stickerType = '';
    let playerName = '';

    // Classify
    if (stickerCode === '00' || stickerCode.startsWith('FWC')) {
      sectionCode = 'FWC';
      sectionType = 'SPECIAL';
      stickerType = 'SPECIAL';
    } else {
      const match = stickerCode.match(/^([A-Z]{3})\s*(\d+)$/);
      if (!match) return; // Should not happen given the regex filter above
      
      sectionCode = match[1];
      sectionType = 'NATIONAL_TEAM';
      const number = match[2];

      if (number === '1') {
        stickerType = 'BADGE';
      } else if (number === '13') {
        stickerType = 'TEAM';
      } else {
        stickerType = 'PLAYER';
        playerName = stickerName;
      }
    }

    if (!sectionOrders.has(sectionCode)) {
      sectionOrders.set(sectionCode, 1);
    } else {
      sectionOrders.set(sectionCode, sectionOrders.get(sectionCode)! + 1);
    }
    const sectionOrder = sectionOrders.get(sectionCode);

    // Format sticker code with space if it doesn't have one
    const formattedStickerCode = stickerCode.replace(/^([A-Z]{3})(\d+)$/, '$1 $2');

    rows.push([
      'world-cup-2026', 
      'Copa do Mundo 2026', 'World Cup 2026', 'Copa del Mundo 2026',
      sectionCode, sectionType, sectionName, sectionName, sectionName,
      formattedStickerCode, stickerType, stickerName, stickerName, stickerName,
      albumOrder++, sectionOrder, playerName, '', ''
    ]);
  });

  console.log(`Parsed ${rows.length} valid base stickers.`);

  const csvContent = stringify(rows, {
    header: true,
    columns: [
      'collection_slug', 'collection_name_pt_br', 'collection_name_en', 'collection_name_es',
      'section_code', 'section_type', 'section_name_pt_br', 'section_name_en', 'section_name_es',
      'sticker_code', 'sticker_type', 'sticker_name_pt_br', 'sticker_name_en', 'sticker_name_es',
      'album_order', 'section_order', 'player_name', 'country_iso2', 'wikidata_id'
    ]
  });

  writeFileSync(OUTPUT_FILE, csvContent);
  console.log(`Saved to ${OUTPUT_FILE}`);
}

parseCatalog();
