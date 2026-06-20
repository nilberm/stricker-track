const { PrismaClient } = require('@sticker-track/database');

const prisma = new PrismaClient();

const isoMapping = {
  'QAT': 'QA', 'ECU': 'EC', 'SEN': 'SN', 'NED': 'NL',
  'ENG': 'GB', 'IRN': 'IR', 'USA': 'US', 'WAL': 'GB',
  'ARG': 'AR', 'KSA': 'SA', 'MEX': 'MX', 'POL': 'PL',
  'FRA': 'FR', 'AUS': 'AU', 'DEN': 'DK', 'TUN': 'TN',
  'ESP': 'ES', 'CRC': 'CR', 'GER': 'DE', 'JPN': 'JP',
  'BEL': 'BE', 'CAN': 'CA', 'MAR': 'MA', 'CRO': 'HR',
  'BRA': 'BR', 'SRB': 'RS', 'SUI': 'CH', 'CMR': 'CM',
  'POR': 'PT', 'GHA': 'GH', 'URU': 'UY', 'KOR': 'KR',
  'SCO': 'GB', 'HAI': 'HT',
  'ITA': 'IT', 'SWE': 'SE', 'COL': 'CO', 'CHI': 'CL', 'PER': 'PE',
  'RSA': 'ZA', 'NGA': 'NG', 'CIV': 'CI', 'ALG': 'DZ', 'EGY': 'EG',
};

async function main() {
  console.log('Fetching national teams...');
  const sections = await prisma.collectionSection.findMany({
    where: { type: 'NATIONAL_TEAM' },
    select: { id: true, code: true, countryIso2: true }
  });

  let updated = 0;

  for (const section of sections) {
    const code = section.code.toUpperCase();
    let iso = isoMapping[code];
    
    if (!iso) {
      iso = code.substring(0, 2);
    }

    // Force strict 2-char length
    if (iso.length > 2) iso = iso.substring(0, 2);

    if (section.countryIso2 !== iso) {
      await prisma.collectionSection.update({
        where: { id: section.id },
        data: { countryIso2: iso }
      });
      console.log(`Updated ${code} -> ${iso}`);
      updated++;
    }
  }

  console.log(`Done. Updated ${updated} teams.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
