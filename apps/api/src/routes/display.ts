import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export default async function displayRoutes(app: FastifyInstance) {
  // GET /api/display/tv – TV board data
  app.get('/tv', async () => {
    const rooms = await prisma.room.findMany({
      where: { centerId: 'ndc-thane', isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        queueEntries: {
          where: { status: { in: ['CALLED', 'IN_PROGRESS', 'WAITING'] } },
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
          take: 5,
          include: {
            visitTest: {
              include: { visit: { include: { patient: true } }, test: true },
            },
          },
        },
      },
    });

    return rooms.map((room) => {
      const serving = room.queueEntries.find((e) =>
        ['CALLED', 'IN_PROGRESS'].includes(e.status)
      );
      const waiting = room.queueEntries.filter((e) => e.status === 'WAITING').slice(0, 3);

      return {
        room: { id: room.id, name: room.name, type: room.type },
        nowServing: serving
          ? {
              entryId: serving.id,
              patientName: serving.visitTest.visit.patient.name,
              tokenNo: serving.position,
              testName: serving.visitTest.test.name,
            }
          : null,
        upNext: waiting.map((e) => ({
          entryId: e.id,
          patientName: e.visitTest.visit.patient.name,
          tokenNo: e.position,
          testName: e.visitTest.test.name,
        })),
      };
    });
  });

  // GET /api/display/floor – floor manager data
  app.get('/floor', async () => {
    const rooms = await prisma.room.findMany({
      where: { centerId: 'ndc-thane', isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        queueEntries: {
          where: { status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS', 'PAUSED'] } },
          include: {
            visitTest: {
              include: { visit: { include: { patient: true } }, test: true },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return rooms.map((room) => ({
      room: { id: room.id, name: room.name, type: room.type },
      queueLength: room.queueEntries.filter((e) => e.status === 'WAITING').length,
      serving: room.queueEntries.filter((e) => ['CALLED', 'IN_PROGRESS'].includes(e.status)).length,
      paused: room.queueEntries.filter((e) => e.status === 'PAUSED').length,
      queue: room.queueEntries.map((e) => ({
        entryId: e.id,
        position: e.position,
        status: e.status,
        patientName: e.visitTest.visit.patient.name,
        testName: e.visitTest.test.name,
        addedAt: e.addedAt,
      })),
    }));
  });
}
