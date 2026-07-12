import type { FastifyInstance } from 'fastify';
import { addressSearchSchema } from '@wall4art/shared';
import { searchAddresses } from '../lib/geocoding.js';
import { sendError } from '../lib/errors.js';

export async function geocodingRoutes(app: FastifyInstance) {
  app.get('/api/v1/geocoding/search', async (request, reply) => {
    const query = addressSearchSchema.parse(request.query);

    if (query.q.length < 3) {
      return [];
    }

    try {
      return await searchAddresses(query.q, query.limit);
    } catch (error) {
      request.log.error(error);
      return sendError(reply, 502, 'GEOCODING_UNAVAILABLE');
    }
  });
}
