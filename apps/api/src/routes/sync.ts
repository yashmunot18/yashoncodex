import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { syncRegistrations } from '../services/receptionSync';

export default async function syncRoutes(app: FastifyInstance) {
  // POST /api/sync/trigger – manually trigger ingestion
  app.post('/trigger', async (req, reply) => {
    try {
      const result = await syncRegistrations();
      return { success: true, ...result };
    } catch (err: any) {
      app.log.error('Sync failed: %o', err);
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // POST /api/sync/webhook – receive push from proxy
  app.post('/webhook', async (req, reply) => {
    const body = z.object({
      registrations: z.array(z.any()),
    }).parse(req.body);

    const result = await syncRegistrations(body.registrations);
    return { success: true, ...result };
  });

  // GET /api/sync/status
  app.get('/status', async () => {
    const latestVisit = await prisma.visit.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { patient: true },
    });
    return {
      lastSyncAt: latestVisit?.createdAt ?? null,
      totalVisitsToday: await prisma.visit.count({
        where: {
          centerId: 'ndc-thane',
          visitDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    };
  });
}
