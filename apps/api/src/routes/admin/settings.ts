import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../index';

const SettingsSchema = z.object({
  sonographyNotReadyWaitMin: z.number().int().min(0).optional(),
  autoRouteOnComplete: z.boolean().optional(),
  pollIntervalMs: z.number().int().min(1000).optional(),
});

export default async function adminSettingsRoutes(app: FastifyInstance) {
  // GET settings
  app.get('/', async () => {
    let settings = await prisma.centerSettings.findUnique({
      where: { centerId: 'ndc-thane' },
    });
    if (!settings) {
      settings = await prisma.centerSettings.create({
        data: {
          centerId: 'ndc-thane',
          sonographyNotReadyWaitMin: 30,
          autoRouteOnComplete: true,
          pollIntervalMs: 60000,
        },
      });
    }
    return settings;
  });

  // GET queue rules
  app.get('/rules', async () => {
    return prisma.queueRule.findMany({ where: { centerId: 'ndc-thane' } });
  });

  // PUT update queue rule
  app.put<{ Params: { key: string } }>('/rules/:key', async (req, reply) => {
    const body = z.object({ value: z.string(), description: z.string().optional() }).parse(req.body);
    const rule = await prisma.queueRule.upsert({
      where: { centerId_key: { centerId: 'ndc-thane', key: req.params.key } },
      update: { value: body.value, description: body.description },
      create: { centerId: 'ndc-thane', key: req.params.key, value: body.value, description: body.description },
    });
    return rule;
  });

  // PUT update settings
  app.put('/', async (req, reply) => {
    const data = SettingsSchema.parse(req.body);
    const settings = await prisma.centerSettings.update({
      where: { centerId: 'ndc-thane' },
      data,
    });
    return settings;
  });
}
