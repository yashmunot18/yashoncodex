import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export default async function patientRoutes(app: FastifyInstance) {
  // GET /api/patient/:visitId/status
  app.get<{ Params: { visitId: string } }>('/:visitId/status', async (req, reply) => {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.visitId },
      include: {
        patient: true,
        visitTests: {
          include: {
            test: true,
            queueEntry: {
              include: { room: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!visit) return reply.code(404).send({ error: 'Visit not found' });

    // Calculate progress
    const total = visit.visitTests.length;
    const completed = visit.visitTests.filter((vt) => vt.status === 'COMPLETED').length;
    const current = visit.visitTests.find((vt) =>
      ['QUEUED', 'CALLING', 'IN_PROGRESS'].includes(vt.status)
    );

    return {
      visit,
      progress: { total, completed, pending: total - completed },
      currentTest: current ?? null,
    };
  });

  // GET /api/patient/search?registrationNo=xxx
  app.get('/search', async (req, reply) => {
    const { registrationNo, phone } = req.query as { registrationNo?: string; phone?: string };
    if (!registrationNo && !phone) {
      return reply.code(400).send({ error: 'Provide registrationNo or phone' });
    }

    const visits = await prisma.visit.findMany({
      where: {
        centerId: 'ndc-thane',
        ...(registrationNo ? { registrationNo } : {}),
        ...(phone ? { patient: { phone } } : {}),
        visitDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: {
        patient: true,
        visitTests: { include: { test: true, queueEntry: { include: { room: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return visits;
  });
}
