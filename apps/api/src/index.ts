import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';

import healthRoutes from './routes/health';
import adminRoomRoutes from './routes/admin/rooms';
import adminTestRoutes from './routes/admin/tests';
import adminMappingRoutes from './routes/admin/mappings';
import adminSettingsRoutes from './routes/admin/settings';
import syncRoutes from './routes/sync';
import queueRoutes from './routes/queue';
import patientRoutes from './routes/patient';
import displayRoutes from './routes/display';
import floorRoutes from './routes/floor';

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

async function bootstrap() {
  // CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Swagger docs
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'NDC QMS API',
        description: 'Queue Management System for NDC Diagnostic Centre',
        version: '1.0.0',
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(adminRoomRoutes, { prefix: '/api/admin/rooms' });
  await app.register(adminTestRoutes, { prefix: '/api/admin/tests' });
  await app.register(adminMappingRoutes, { prefix: '/api/admin/mappings' });
  await app.register(adminSettingsRoutes, { prefix: '/api/admin/settings' });
  await app.register(syncRoutes, { prefix: '/api/sync' });
  await app.register(queueRoutes, { prefix: '/api/queue' });
  await app.register(patientRoutes, { prefix: '/api/patient' });
  await app.register(displayRoutes, { prefix: '/api/display' });
  await app.register(floorRoutes, { prefix: '/api/floor' });

  // PORT is the standard env var injected by Render/Railway; fall back to
  // the repo-specific API_PORT for local Docker Compose, then hard-code 4000.
  const port = parseInt(process.env.PORT ?? process.env.API_PORT ?? '4000', 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 NDC QMS API running on http://0.0.0.0:${port}`);
  console.log(`📚 API Docs: http://0.0.0.0:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
