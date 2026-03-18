import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../index';

const RoomSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SONOGRAPHY', 'BLOOD_COLLECTION', 'STRESS_TEST', 'MAMMOGRAPHY', 'XRAY', 'CONSULTATION', 'EYE_HEARING', 'OTHER']).default('OTHER'),
  isActive: z.boolean().default(true),
  capacity: z.number().int().positive().default(1),
  displayOrder: z.number().int().default(0),
});

export default async function adminRoomRoutes(app: FastifyInstance) {
  // GET all rooms
  app.get('/', async (req, reply) => {
    const rooms = await prisma.room.findMany({
      where: { centerId: 'ndc-thane' },
      orderBy: { displayOrder: 'asc' },
      include: { mappings: { include: { test: true } } },
    });
    return rooms;
  });

  // GET single room
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { mappings: { include: { test: true } } },
    });
    if (!room) return reply.code(404).send({ error: 'Room not found' });
    return room;
  });

  // POST create room
  app.post('/', async (req, reply) => {
    const data = RoomSchema.parse(req.body);
    const room = await prisma.room.create({
      data: { ...data, centerId: 'ndc-thane' },
    });
    await prisma.auditEvent.create({
      data: { entityType: 'Room', entityId: room.id, action: 'CREATE', data: data },
    });
    return reply.code(201).send(room);
  });

  // PUT update room
  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const data = RoomSchema.partial().parse(req.body);
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data,
    });
    await prisma.auditEvent.create({
      data: { entityType: 'Room', entityId: room.id, action: 'UPDATE', data: data },
    });
    return room;
  });

  // DELETE room
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await prisma.room.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    return { success: true };
  });
}
