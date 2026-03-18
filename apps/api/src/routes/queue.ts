import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { QueueService } from '../services/queueService';

export default async function queueRoutes(app: FastifyInstance) {
  // GET /api/queue/rooms/:roomId – queue for a room
  app.get<{ Params: { roomId: string } }>('/rooms/:roomId', async (req) => {
    return QueueService.getRoomQueue(req.params.roomId);
  });

  // POST /api/queue/:entryId/call
  app.post<{ Params: { entryId: string } }>('/:entryId/call', async (req, reply) => {
    const result = await QueueService.callPatient(req.params.entryId);
    if (!result) return reply.code(404).send({ error: 'Queue entry not found' });
    return result;
  });

  // POST /api/queue/:entryId/start
  app.post<{ Params: { entryId: string } }>('/:entryId/start', async (req, reply) => {
    const result = await QueueService.startService(req.params.entryId);
    if (!result) return reply.code(404).send({ error: 'Queue entry not found' });
    return result;
  });

  // POST /api/queue/:entryId/complete
  app.post<{ Params: { entryId: string } }>('/:entryId/complete', async (req, reply) => {
    const body = z.object({ notes: z.string().optional() }).optional().parse(req.body);
    const result = await QueueService.completeService(req.params.entryId, body?.notes);
    if (!result) return reply.code(404).send({ error: 'Queue entry not found' });
    return result;
  });

  // POST /api/queue/:entryId/not-ready
  app.post<{ Params: { entryId: string } }>('/:entryId/not-ready', async (req, reply) => {
    const body = z.object({ waitMinutes: z.number().optional() }).optional().parse(req.body);
    const result = await QueueService.markNotReady(req.params.entryId, body?.waitMinutes);
    if (!result) return reply.code(404).send({ error: 'Queue entry not found' });
    return result;
  });

  // POST /api/queue/visit/:visitId/assign – route patient to next test
  app.post<{ Params: { visitId: string } }>('/visit/:visitId/assign', async (req, reply) => {
    const result = await QueueService.routePatientToNextTest(req.params.visitId);
    return result;
  });
}
