require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@sticker-track/database');

const prisma = new PrismaClient();

const isoMapping = {
  'QAT': 'QA', 'ECU': 'EC', 'SEN': 'SN', 'NED': 'NL', // Group A (2022)
  'ENG': 'GB-ENG', 'IRN': 'IR', 'USA': 'US', 'WAL': 'GB-WLS', // Group B
  'ARG': 'AR', 'KSA': 'SA', 'MEX': 'MX', 'POL': 'PL', // Group C
  'FRA': 'FR', 'AUS': 'AU', 'DEN': 'DK', 'TUN': 'TN', // Group D
  'ESP': 'ES', 'CRC': 'CR', 'GER': 'DE', 'JPN': 'JP', // Group E
  'BEL': 'BE', 'CAN': 'CA', 'MAR': 'MA', 'CRO': 'HR', // Group F
  'BRA': 'BR', 'SRB': 'RS', 'SUI': 'CH', 'CMR': 'CM', // Group G
  'POR': 'PT', 'GHA': 'GH', 'URU': 'UY', 'KOR': 'KR', // Group H
  // Extras
  'SCO': 'GB-SCT', 'HAI': 'HT',
  'ITA': 'IT', 'SWE': 'SE', 'COL': 'CO', 'CHI': 'CL', 'PER': 'PE',
  'RSA': 'ZA', 'NGA': 'NG', 'CIV': 'CI', 'ALG': 'DZ', 'EGY': 'EG',
};

async function main() {
  console.log('Fetching national teams...');
  const sections = await prisma.collectionSection.findMany({
    where: { type: 'NATIONAL_TEAM' },
    select: { id: true, code: true, name: true, countryIso2: true }
  });

  console.log(`Found ${sections.length} national teams.`);
  let updated = 0;

  for (const section of sections) {
    const code = section.code.toUpperCase();
    let iso = isoMapping[code];
    
    // Fallback logic
    if (!iso) {
      iso = code.substring(0, 2);
    }

    if (section.countryIso2 !== iso) {
      await prisma.collectionSection.update({
        where: { id: section.id },
        data: { countryIso2: iso }
      });
      console.log(`Updated ${code} (${section.name}) -> ${iso}`);
      updated++;
    }
  }

  console.log(`Done. Updated ${updated} teams.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
