import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../index';

const MappingSchema = z.object({
  testId: z.string(),
  roomId: z.string(),
  priority: z.number().int().default(1),
  isDefault: z.boolean().default(true),
});

export default async function adminMappingRoutes(app: FastifyInstance) {
  // GET all mappings
  app.get('/', async () => {
    return prisma.testRoomMapping.findMany({
      include: {
        test: true,
        room: true,
      },
    });
  });

  // POST create mapping
  app.post('/', async (req, reply) => {
    const data = MappingSchema.parse(req.body);
    const existing = await prisma.testRoomMapping.findUnique({
      where: { testId_roomId: { testId: data.testId, roomId: data.roomId } },
    });
    if (existing) return reply.code(409).send({ error: 'Mapping already exists' });
    const mapping = await prisma.testRoomMapping.create({ data });
    return reply.code(201).send(mapping);
  });

  // PUT update mapping
  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const data = MappingSchema.partial().parse(req.body);
    const mapping = await prisma.testRoomMapping.update({
      where: { id: req.params.id },
      data,
    });
    return mapping;
  });

  // DELETE mapping
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await prisma.testRoomMapping.delete({ where: { id: req.params.id } });
    return { success: true };
  });
}
