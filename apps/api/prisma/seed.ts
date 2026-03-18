import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NDC Diagnostic Centre – THANE...');

  // ─── Company ────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: 'ndc-company' },
    update: {},
    create: {
      id: 'ndc-company',
      name: 'NDC DIAGNOSTIC CENTRE',
    },
  });

  // ─── Center ─────────────────────────────────────────────
  const center = await prisma.center.upsert({
    where: { id: 'ndc-thane' },
    update: {},
    create: {
      id: 'ndc-thane',
      companyId: company.id,
      name: 'THANE',
      city: 'Thane',
      address: 'NDC Diagnostic Centre, Thane, Maharashtra',
      phone: '',
    },
  });

  // ─── Center settings ────────────────────────────────────
  await prisma.centerSettings.upsert({
    where: { centerId: center.id },
    update: {},
    create: {
      centerId: center.id,
      sonographyNotReadyWaitMin: 30,
      autoRouteOnComplete: true,
      pollIntervalMs: 60000,
    },
  });

  // ─── Rooms ──────────────────────────────────────────────
  const roomDefs = [
    { id: 'room-sono',   name: 'Sonography',               type: 'SONOGRAPHY'      as const, displayOrder: 1 },
    { id: 'room-blood',  name: 'Blood Collection',         type: 'BLOOD_COLLECTION'as const, displayOrder: 2 },
    { id: 'room-stress', name: 'Stress Test Treadmill',    type: 'STRESS_TEST'     as const, displayOrder: 3 },
    { id: 'room-mammo',  name: 'Mammography',              type: 'MAMMOGRAPHY'     as const, displayOrder: 4 },
    { id: 'room-xray',   name: 'X-Ray',                    type: 'XRAY'            as const, displayOrder: 5 },
    { id: 'room-cons1',  name: 'Consultation 1',           type: 'CONSULTATION'    as const, displayOrder: 6 },
    { id: 'room-cons2',  name: 'Consultation 2',           type: 'CONSULTATION'    as const, displayOrder: 7 },
    { id: 'room-eye',    name: 'Eye / Hearing Basic Test', type: 'EYE_HEARING'     as const, displayOrder: 8 },
  ];

  for (const r of roomDefs) {
    await prisma.room.upsert({
      where: { id: r.id },
      update: {},
      create: { ...r, centerId: center.id },
    });
  }

  // ─── Tests ──────────────────────────────────────────────
  const testDefs = [
    { id: 'test-usg-abdomen',   name: 'USG Abdomen',               code: 'USG-ABD',   defaultDurationMin: 20, requiresPrep: true,  prepInstructions: 'Full bladder required. Drink 4–6 glasses of water 1 hour before.',  roomId: 'room-sono',   displayOrder: 1 },
    { id: 'test-usg-pelvis',    name: 'USG Pelvis',                code: 'USG-PEL',   defaultDurationMin: 20, requiresPrep: true,  prepInstructions: 'Full bladder required.',                                               roomId: 'room-sono',   displayOrder: 2 },
    { id: 'test-usg-whole',     name: 'USG Whole Abdomen & Pelvis',code: 'USG-WAP',   defaultDurationMin: 25, requiresPrep: true,  prepInstructions: 'Full bladder required. Drink 4–6 glasses of water 1 hour before.',  roomId: 'room-sono',   displayOrder: 3 },
    { id: 'test-usg-thyroid',   name: 'USG Thyroid',               code: 'USG-THY',   defaultDurationMin: 15, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-sono',   displayOrder: 4 },
    { id: 'test-usg-breast',    name: 'USG Breast',                code: 'USG-BRE',   defaultDurationMin: 15, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-sono',   displayOrder: 5 },
    { id: 'test-cbc',           name: 'CBC (Complete Blood Count)', code: 'CBC',       defaultDurationMin: 10, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-blood',  displayOrder: 6 },
    { id: 'test-lft',           name: 'Liver Function Test',       code: 'LFT',       defaultDurationMin: 10, requiresPrep: true,  prepInstructions: 'Fasting required (8–12 hours).',                                      roomId: 'room-blood',  displayOrder: 7 },
    { id: 'test-kft',           name: 'Kidney Function Test',      code: 'KFT',       defaultDurationMin: 10, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-blood',  displayOrder: 8 },
    { id: 'test-lipid',         name: 'Lipid Profile',             code: 'LIPID',     defaultDurationMin: 10, requiresPrep: true,  prepInstructions: 'Fasting required (9–12 hours).',                                      roomId: 'room-blood',  displayOrder: 9 },
    { id: 'test-tmt',           name: 'Treadmill Stress Test (TMT)',code: 'TMT',       defaultDurationMin: 30, requiresPrep: false, prepInstructions: 'Wear comfortable shoes. Avoid heavy meals 2 hours before.',           roomId: 'room-stress', displayOrder: 10 },
    { id: 'test-mammo',         name: 'Mammography',               code: 'MAMMO',     defaultDurationMin: 20, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-mammo',  displayOrder: 11 },
    { id: 'test-xray-chest',    name: 'X-Ray Chest',               code: 'XR-CHEST',  defaultDurationMin: 10, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-xray',   displayOrder: 12 },
    { id: 'test-xray-knee',     name: 'X-Ray Knee',                code: 'XR-KNEE',   defaultDurationMin: 10, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-xray',   displayOrder: 13 },
    { id: 'test-xray-spine',    name: 'X-Ray Spine',               code: 'XR-SPINE',  defaultDurationMin: 10, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-xray',   displayOrder: 14 },
    { id: 'test-cons1',         name: 'Physician Consultation',    code: 'CONS',      defaultDurationMin: 15, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-cons1',  displayOrder: 15 },
    { id: 'test-eye-hearing',   name: 'Eye & Hearing Basic Test',  code: 'EYE-HEAR',  defaultDurationMin: 15, requiresPrep: false, prepInstructions: null,                                                                  roomId: 'room-eye',    displayOrder: 16 },
  ];

  for (const t of testDefs) {
    const { roomId, ...testData } = t;
    const test = await prisma.test.upsert({
      where: { id: testData.id },
      update: {},
      create: { ...testData, centerId: center.id },
    });

    // mapping
    await prisma.testRoomMapping.upsert({
      where: { testId_roomId: { testId: test.id, roomId } },
      update: {},
      create: { testId: test.id, roomId, priority: 1, isDefault: true },
    });
  }

  // ─── Queue Rules ────────────────────────────────────────
  const rules = [
    { key: 'sonography_not_ready_reentry_position', value: 'end_of_slot_group',    description: 'How to re-enter a not-ready sonography patient. Values: end_of_slot_group | absolute_end | configured_minutes' },
    { key: 'blood_collection_priority',             value: 'registration_order',   description: 'Priority rule for blood collection queue' },
    { key: 'auto_route_on_complete',                value: 'true',                 description: 'Automatically assign patient to next test room on completion' },
    { key: 'call_timeout_minutes',                  value: '5',                    description: 'Minutes to wait for patient after Call before marking absent' },
  ];

  for (const rule of rules) {
    await prisma.queueRule.upsert({
      where: { centerId_key: { centerId: center.id, key: rule.key } },
      update: {},
      create: { centerId: center.id, ...rule },
    });
  }

  console.log('✅ Seed completed successfully.');
  console.log(`   Company : ${company.name}`);
  console.log(`   Center  : ${center.name} (${center.city})`);
  console.log(`   Rooms   : ${roomDefs.length}`);
  console.log(`   Tests   : ${testDefs.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
