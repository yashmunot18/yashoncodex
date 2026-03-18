import axios from 'axios';
import { prisma } from '../index';

interface ProxyRegistration {
  id: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  patientDob?: string;
  registrationNo: string;
  tests: string[]; // test codes
  visitDate?: string;
}

export async function syncRegistrations(
  registrations?: ProxyRegistration[]
): Promise<{ synced: number; skipped: number; errors: number }> {
  let records: ProxyRegistration[] = registrations ?? [];

  // If no records passed, fetch from proxy
  if (!records.length) {
    const baseUrl = process.env.RECEPTION_PROXY_BASE_URL;
    const apiKey = process.env.RECEPTION_PROXY_API_KEY;
    const timeout = parseInt(process.env.RECEPTION_PROXY_TIMEOUT_MS ?? '10000', 10);

    if (!baseUrl || !apiKey) {
      console.warn('⚠️  Reception proxy not configured. Set RECEPTION_PROXY_BASE_URL and RECEPTION_PROXY_API_KEY in .env');
      return { synced: 0, skipped: 0, errors: 0 };
    }

    const response = await axios.get<ProxyRegistration[]>(`${baseUrl}/registrations`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'X-API-Key': apiKey },
      timeout,
      params: { date: new Date().toISOString().slice(0, 10) },
    });
    records = response.data;
  }

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const rec of records) {
    try {
      // Idempotency check
      const existingVisit = await prisma.visit.findUnique({
        where: { externalRef: String(rec.id) },
      });
      if (existingVisit) {
        skipped++;
        continue;
      }

      // Upsert patient
      const patient = await prisma.patient.upsert({
        where: { externalId: String(rec.id) },
        update: {
          name: rec.patientName,
          age: rec.patientAge,
          gender: rec.patientGender,
          phone: rec.patientPhone,
        },
        create: {
          externalId: String(rec.id),
          name: rec.patientName,
          age: rec.patientAge,
          gender: rec.patientGender,
          phone: rec.patientPhone,
          dob: rec.patientDob ? new Date(rec.patientDob) : undefined,
        },
      });

      // Create visit
      const visit = await prisma.visit.create({
        data: {
          patientId: patient.id,
          centerId: 'ndc-thane',
          registrationNo: rec.registrationNo,
          externalRef: String(rec.id),
          visitDate: rec.visitDate ? new Date(rec.visitDate) : new Date(),
          status: 'ACTIVE',
        },
      });

      // Create VisitTest entries
      for (const testCode of rec.tests ?? []) {
        const test = await prisma.test.findFirst({
          where: { centerId: 'ndc-thane', code: testCode, isActive: true },
          include: { mappings: { where: { isDefault: true }, include: { room: true } } },
        });
        if (!test) {
          console.warn(`Test code ${testCode} not found, skipping`);
          continue;
        }
        const defaultRoom = test.mappings[0];

        const visitTest = await prisma.visitTest.create({
          data: {
            visitId: visit.id,
            testId: test.id,
            roomId: defaultRoom?.roomId ?? null,
            status: 'PENDING',
          },
        });

        // Auto-enqueue into room queue
        if (defaultRoom) {
          await enqueueVisitTest(visitTest.id, defaultRoom.roomId);
        }
      }

      await prisma.auditEvent.create({
        data: {
          entityType: 'Visit',
          entityId: visit.id,
          action: 'SYNC_CREATED',
          data: rec as any,
        },
      });

      synced++;
    } catch (err) {
      console.error(`Error syncing registration ${rec.id}:`, err);
      errors++;
    }
  }

  return { synced, skipped, errors };
}

export async function enqueueVisitTest(visitTestId: string, roomId: string): Promise<void> {
  // Get next position
  const maxEntry = await prisma.queueEntry.findFirst({
    where: { roomId, status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] } },
    orderBy: { position: 'desc' },
  });
  const position = (maxEntry?.position ?? 0) + 1;

  await prisma.queueEntry.create({
    data: {
      visitTestId,
      roomId,
      position,
      status: 'WAITING',
    },
  });

  await prisma.visitTest.update({
    where: { id: visitTestId },
    data: { status: 'QUEUED', roomId },
  });
}
