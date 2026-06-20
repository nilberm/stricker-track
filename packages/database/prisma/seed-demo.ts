import { hash } from 'argon2';
import {
  PrismaClient,
  StickerType,
  SupportedLocale,
  UserRole,
  CollectionStatus,
  SectionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const collectionTranslations = {
  PT_BR: {
    publishedName: 'Torneio Internacional de Demonstração',
    publishedDescription: 'Uma coleção fictícia criada para testar o catálogo.',
    draftName: 'Coleção Experimental',
    draftDescription: 'Uma coleção não publicada para validar permissões.',
    sections: [
      'Estrelas do Norte',
      'Estrelas do Sul',
      'Horizonte Leste',
      'Costa Oeste',
    ],
  },
  EN: {
    publishedName: 'Demo International Tournament',
    publishedDescription: 'A fictional collection created to test the catalog.',
    draftName: 'Experimental Collection',
    draftDescription: 'An unpublished collection used to validate permissions.',
    sections: [
      'Northern Stars',
      'Southern Stars',
      'Eastern Horizon',
      'Western Coast',
    ],
  },
  ES: {
    publishedName: 'Torneo Internacional de Demostración',
    publishedDescription:
      'Una colección ficticia creada para probar el catálogo.',
    draftName: 'Colección Experimental',
    draftDescription: 'Una colección no publicada para validar permisos.',
    sections: [
      'Estrellas del Norte',
      'Estrellas del Sur',
      'Horizonte Este',
      'Costa Oeste',
    ],
  },
} as const;

const sectionDefinitions = [
  { code: 'NTH', order: 1 },
  { code: 'STH', order: 2 },
  { code: 'EST', order: 3 },
  { code: 'WST', order: 4 },
];

const types = [
  StickerType.PLAYER,
  StickerType.PLAYER,
  StickerType.TEAM,
  StickerType.BADGE,
  StickerType.STADIUM,
  StickerType.SPECIAL,
] as const;

async function seedCollectionTranslations(
  collectionId: string,
  nameKey: 'publishedName' | 'draftName',
  descriptionKey: 'publishedDescription' | 'draftDescription',
) {
  for (const locale of Object.values(SupportedLocale)) {
    await prisma.collectionTranslation.upsert({
      where: { collectionId_locale: { collectionId, locale } },
      update: {
        name: collectionTranslations[locale][nameKey],
        description: collectionTranslations[locale][descriptionKey],
      },
      create: {
        collectionId,
        locale,
        name: collectionTranslations[locale][nameKey],
        description: collectionTranslations[locale][descriptionKey],
      },
    });
  }
}

async function main() {
  if (process.env.ENABLE_DEMO_DATA !== 'true') {
    console.log('Skipping demo data seeding. Set ENABLE_DEMO_DATA=true to seed demo data.');
    return;
  }

  const passwordHash = await hash('DemoPassword123!');
  await prisma.user.upsert({
    where: { email: 'demo@stickertrack.local' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@stickertrack.local',
      passwordHash,
      role: UserRole.USER,
      preferredLocale: SupportedLocale.PT_BR,
    },
  });
  await prisma.user.upsert({
    where: { email: 'demo2@stickertrack.local' },
    update: {},
    create: {
      name: 'Second Demo User',
      email: 'demo2@stickertrack.local',
      passwordHash,
      role: UserRole.USER,
      preferredLocale: SupportedLocale.EN,
    },
  });
  await prisma.user.upsert({
    where: { email: 'admin@stickertrack.local' },
    update: { role: UserRole.ADMIN },
    create: {
      name: 'Demo Admin',
      email: 'admin@stickertrack.local',
      passwordHash,
      role: UserRole.ADMIN,
      preferredLocale: SupportedLocale.EN,
    },
  });

  const published = await prisma.collection.upsert({
    where: { slug: 'demo-international-tournament' },
    update: {
      totalStickers: 30,
      status: CollectionStatus.PUBLISHED,
      codeExample: 'NTH 01',
      codePrefixMinLength: 3,
      codePrefixMaxLength: 3,
      codeNumberMinLength: 1,
      codeNumberMaxLength: 2,
    },
    create: {
      slug: 'demo-international-tournament',
      releaseYear: 2026,
      totalStickers: 30,
      status: CollectionStatus.PUBLISHED,
      codePattern: '^[A-Z]{2,5}\\s?\\d{1,4}$',
      codeExample: 'NTH 01',
      codePrefixMinLength: 3,
      codePrefixMaxLength: 3,
      codeNumberMinLength: 1,
      codeNumberMaxLength: 2,
    },
  });
  await seedCollectionTranslations(
    published.id,
    'publishedName',
    'publishedDescription',
  );

  const draft = await prisma.collection.upsert({
    where: { slug: 'experimental-draft-collection' },
    update: { status: CollectionStatus.DRAFT },
    create: {
      slug: 'experimental-draft-collection',
      releaseYear: 2027,
      totalStickers: 12,
      status: CollectionStatus.DRAFT,
    },
  });
  await seedCollectionTranslations(draft.id, 'draftName', 'draftDescription');

  const sections = [];
  for (const [index, definition] of sectionDefinitions.entries()) {
    const section = await prisma.collectionSection.upsert({
      where: {
        collectionId_order: {
          collectionId: published.id,
          order: definition.order,
        },
      },
      update: { code: definition.code, type: SectionType.NATIONAL_TEAM },
      create: { collectionId: published.id, type: SectionType.NATIONAL_TEAM, ...definition },
    });
    for (const locale of Object.values(SupportedLocale)) {
      await prisma.collectionSectionTranslation.upsert({
        where: { sectionId_locale: { sectionId: section.id, locale } },
        update: { name: collectionTranslations[locale].sections[index] },
        create: {
          sectionId: section.id,
          locale,
          name: collectionTranslations[locale].sections[index],
        },
      });
    }
    sections.push(section);
  }

  for (let index = 0; index < 30; index += 1) {
    const sectionIndex = Math.min(3, Math.floor(index / 8));
    const section = sections[sectionIndex];
    const number = (index % 8) + 1;
    const isOcrValidationSticker = index === 29;
    const prefix = isOcrValidationSticker ? 'NED' : section.code;
    const stickerNumber = isOcrValidationSticker ? 19 : number;
    const code = `${prefix} ${String(stickerNumber).padStart(2, '0')}`;
    const normalizedCode = `${prefix}${stickerNumber}`;
    const type = types[index % types.length];
    let playerId: string | undefined;

    if (type === StickerType.PLAYER && index % 3 !== 2) {
      const playerName = `Demo Athlete ${String(index + 1).padStart(2, '0')}`;
      const player = await prisma.player.upsert({
        where: { sportsDbId: `demo-${index + 1}` },
        update: {
          name: playerName,
          normalizedName: playerName.toLowerCase(),
        },
        create: {
          name: playerName,
          normalizedName: playerName.toLowerCase(),
          displayName: playerName,
          countryCode: section.code,
          nationality: `Demo Region ${sectionIndex + 1}`,
          position: index % 2 === 0 ? 'Forward' : 'Defender',
          sportsDbId: `demo-${index + 1}`,
        },
      });
      playerId = player.id;
    }

    await prisma.sticker.upsert({
      where: {
        collectionId_albumOrder: {
          collectionId: published.id,
          albumOrder: index + 1,
        },
      },
      update: {
        sectionId: section.id,
        playerId,
        code,
        normalizedCode,
        prefix,
        number: stickerNumber,
        name: isOcrValidationSticker
          ? 'Fictional OCR Validation Sticker'
          : type === StickerType.PLAYER
            ? `Demo Athlete Card ${index + 1}`
            : `Demo ${type.toLowerCase()} ${index + 1}`,
        type,
        albumOrder: index + 1,
        sectionOrder: number,
      },
      create: {
        collectionId: published.id,
        sectionId: section.id,
        playerId,
        code,
        normalizedCode,
        prefix,
        number: stickerNumber,
        name: isOcrValidationSticker
          ? 'Fictional OCR Validation Sticker'
          : type === StickerType.PLAYER
            ? `Demo Athlete Card ${index + 1}`
            : `Demo ${type.toLowerCase()} ${index + 1}`,
        type,
        albumOrder: index + 1,
        sectionOrder: number,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
