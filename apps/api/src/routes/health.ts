import { FastifyInstance } from 'fastify';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return {
      status: 'ok',
      service: 'NDC QMS API',
      timestamp: new Date().toISOString(),
    };
  });
}
