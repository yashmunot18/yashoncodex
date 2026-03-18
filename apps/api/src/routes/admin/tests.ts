import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../index';

const TestSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  defaultDurationMin: z.number().int().positive().default(15),
  requiresPrep: z.boolean().default(false),
  prepInstructions: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export default async function adminTestRoutes(app: FastifyInstance) {
  // GET all tests
  app.get('/', async () => {
    return prisma.test.findMany({
      where: { centerId: 'ndc-thane' },
      orderBy: { displayOrder: 'asc' },
      include: { mappings: { include: { room: true } } },
    });
  });

  // GET single
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { mappings: { include: { room: true } } },
    });
    if (!test) return reply.code(404).send({ error: 'Test not found' });
    return test;
  });

  // POST create
  app.post('/', async (req, reply) => {
    const data = TestSchema.parse(req.body);
    const test = await prisma.test.create({
      data: { ...data, centerId: 'ndc-thane' },
    });
    await prisma.auditEvent.create({
      data: { entityType: 'Test', entityId: test.id, action: 'CREATE', data },
    });
    return reply.code(201).send(test);
  });

  // PUT update
  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const data = TestSchema.partial().parse(req.body);
    const test = await prisma.test.update({
      where: { id: req.params.id },
      data,
    });
    await prisma.auditEvent.create({
      data: { entityType: 'Test', entityId: test.id, action: 'UPDATE', data },
    });
    return test;
  });

  // DELETE
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await prisma.test.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    return { success: true };
  });
}
