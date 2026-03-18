import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export default async function floorRoutes(app: FastifyInstance) {
  // GET /api/floor/dashboard
  app.get('/dashboard', async () => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [totalVisits, activeVisits, completedVisits, rooms] = await Promise.all([
      prisma.visit.count({ where: { centerId: 'ndc-thane', visitDate: { gte: today } } }),
      prisma.visit.count({ where: { centerId: 'ndc-thane', status: 'ACTIVE', visitDate: { gte: today } } }),
      prisma.visit.count({ where: { centerId: 'ndc-thane', status: 'COMPLETED', visitDate: { gte: today } } }),
      prisma.room.findMany({
        where: { centerId: 'ndc-thane', isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: {
          queueEntries: {
            where: { status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS', 'PAUSED'] } },
            include: {
              visitTest: {
                include: {
                  visit: { include: { patient: true } },
                  test: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
      }),
    ]);

    return {
      summary: { totalVisits, activeVisits, completedVisits },
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        waiting: room.queueEntries.filter((e) => e.status === 'WAITING').length,
        serving: room.queueEntries.filter((e) => ['CALLED', 'IN_PROGRESS'].includes(e.status)).length,
        paused: room.queueEntries.filter((e) => e.status === 'PAUSED').length,
        queue: room.queueEntries.map((e) => ({
          entryId: e.id,
          position: e.position,
          status: e.status,
          patientName: e.visitTest.visit.patient.name,
          testName: e.visitTest.test.name,
          addedAt: e.addedAt,
          calledAt: e.calledAt,
        })),
      })),
    };
  });

  // GET /api/floor/patients – all active patients today
  app.get('/patients', async () => {
    return prisma.visit.findMany({
      where: {
        centerId: 'ndc-thane',
        status: 'ACTIVE',
        visitDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: {
        patient: true,
        visitTests: {
          include: {
            test: true,
            queueEntry: { include: { room: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  });
}
