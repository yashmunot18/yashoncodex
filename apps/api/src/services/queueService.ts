import { prisma } from '../index';
import { enqueueVisitTest } from './receptionSync';

export const QueueService = {
  // Get full queue for a room
  async getRoomQueue(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        queueEntries: {
          where: { status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS', 'PAUSED'] } },
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
          include: {
            visitTest: {
              include: {
                visit: { include: { patient: true } },
                test: true,
              },
            },
          },
        },
      },
    });
    if (!room) return null;

    const nowServing = room.queueEntries.find((e) =>
      ['CALLED', 'IN_PROGRESS'].includes(e.status)
    );
    const waiting = room.queueEntries.filter((e) => e.status === 'WAITING');
    const paused = room.queueEntries.filter((e) => e.status === 'PAUSED');

    return {
      room: { id: room.id, name: room.name, type: room.type },
      nowServing: nowServing ? mapEntry(nowServing) : null,
      waiting: waiting.map(mapEntry),
      paused: paused.map(mapEntry),
    };
  },

  // Call patient
  async callPatient(entryId: string) {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { visitTest: true },
    });
    if (!entry) return null;

    const updated = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'CALLED', calledAt: new Date() },
    });
    await prisma.visitTest.update({
      where: { id: entry.visitTestId },
      data: { status: 'CALLING' },
    });
    await prisma.auditEvent.create({
      data: { entityType: 'QueueEntry', entityId: entryId, action: 'CALL' },
    });
    return updated;
  },

  // Start service
  async startService(entryId: string) {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { visitTest: true },
    });
    if (!entry) return null;

    const updated = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'IN_PROGRESS' },
    });
    await prisma.visitTest.update({
      where: { id: entry.visitTestId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
    await prisma.auditEvent.create({
      data: { entityType: 'QueueEntry', entityId: entryId, action: 'START' },
    });
    return updated;
  },

  // Complete service
  async completeService(entryId: string, notes?: string) {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: {
        visitTest: {
          include: { visit: true },
        },
      },
    });
    if (!entry) return null;

    await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'DONE' },
    });
    await prisma.visitTest.update({
      where: { id: entry.visitTestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: notes ?? undefined,
      },
    });
    await prisma.auditEvent.create({
      data: { entityType: 'QueueEntry', entityId: entryId, action: 'COMPLETE', data: { notes } },
    });

    // Auto-route to next test
    const settings = await prisma.centerSettings.findUnique({
      where: { centerId: 'ndc-thane' },
    });
    if (settings?.autoRouteOnComplete) {
      await this.routePatientToNextTest(entry.visitTest.visitId);
    }

    return { success: true, entryId };
  },

  // Mark not ready (sonography specific)
  async markNotReady(entryId: string, waitMinutes?: number) {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { visitTest: true, room: true },
    });
    if (!entry) return null;

    // Get configured wait time
    const settings = await prisma.centerSettings.findUnique({
      where: { centerId: 'ndc-thane' },
    });
    const waitMin = waitMinutes ?? settings?.sonographyNotReadyWaitMin ?? 30;
    const pausedUntil = new Date(Date.now() + waitMin * 60 * 1000);

    // Get the queue rule for reentry behavior
    const reentryRule = await prisma.queueRule.findUnique({
      where: { centerId_key: { centerId: 'ndc-thane', key: 'sonography_not_ready_reentry_position' } },
    });

    let newPosition: number;
    const behavior = reentryRule?.value ?? 'end_of_slot_group';

    if (behavior === 'absolute_end') {
      // Put at absolute end
      const maxEntry = await prisma.queueEntry.findFirst({
        where: { roomId: entry.roomId, status: { in: ['WAITING', 'PAUSED'] } },
        orderBy: { position: 'desc' },
      });
      newPosition = (maxEntry?.position ?? 0) + 1;
    } else {
      // Default: end of same-slot-group (same slot time window) or just pause in place
      newPosition = entry.position; // keep position, just set as paused
    }

    await prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: 'PAUSED',
        position: newPosition,
        pausedUntil,
      },
    });
    await prisma.visitTest.update({
      where: { id: entry.visitTestId },
      data: { status: 'NOT_READY' },
    });
    await prisma.auditEvent.create({
      data: {
        entityType: 'QueueEntry',
        entityId: entryId,
        action: 'NOT_READY',
        data: { waitMinutes: waitMin, pausedUntil },
      },
    });

    return { success: true, pausedUntil, waitMinutes: waitMin };
  },

  // Route patient to next pending test
  async routePatientToNextTest(visitId: string) {
    const pendingTests = await prisma.visitTest.findMany({
      where: { visitId, status: 'PENDING' },
      include: {
        test: {
          include: { mappings: { where: { isDefault: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!pendingTests.length) {
      // All done – mark visit complete
      const allTests = await prisma.visitTest.findMany({ where: { visitId } });
      const allCompleted = allTests.every((t) =>
        ['COMPLETED', 'SKIPPED'].includes(t.status)
      );
      if (allCompleted) {
        await prisma.visit.update({
          where: { id: visitId },
          data: { status: 'COMPLETED' },
        });
      }
      return { routed: false, message: 'No pending tests' };
    }

    const next = pendingTests[0];
    const defaultRoom = next.test.mappings[0];
    if (!defaultRoom) return { routed: false, message: 'No room mapped for test' };

    await enqueueVisitTest(next.id, defaultRoom.roomId);
    return { routed: true, testId: next.testId, roomId: defaultRoom.roomId };
  },
};

// Helper to map queue entry to response
function mapEntry(entry: any) {
  return {
    entryId: entry.id,
    position: entry.position,
    status: entry.status,
    patientName: entry.visitTest.visit.patient.name,
    patientPhone: entry.visitTest.visit.patient.phone,
    testName: entry.visitTest.test.name,
    visitId: entry.visitTest.visitId,
    visitTestId: entry.visitTestId,
    addedAt: entry.addedAt,
    calledAt: entry.calledAt,
    pausedUntil: entry.pausedUntil,
  };
}
