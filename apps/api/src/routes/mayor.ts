import type { FastifyInstance } from 'fastify';
import { mayorDecisionSchema } from '@wall4art/shared';
import { prisma } from '../lib/prisma.js';
import { getSessionUser, requireAuth, requireRole } from '../lib/session.js';

export async function mayorRoutes(app: FastifyInstance) {
  app.get('/api/v1/mayor/locations/pending', async (request) => {
    const user = requireAuth(await getSessionUser(request));
    requireRole(user, 'MAIRE');

    return prisma.location.findMany({
      where: {
        status: 'PENDING_VALIDATION',
        mayorValidationStatus: 'PENDING',
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post<{ Params: { id: string } }>(
    '/api/v1/mayor/locations/:id/approve',
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      requireRole(user, 'MAIRE');
      const body = mayorDecisionSchema.parse(request.body ?? {});

      const location = await prisma.location.findUnique({ where: { id: request.params.id } });
      if (!location) return reply.status(404).send({ error: 'Location not found' });
      if (location.status !== 'PENDING_VALIDATION') {
        return reply.status(400).send({ error: 'Location is not pending validation' });
      }

      return prisma.location.update({
        where: { id: request.params.id },
        data: {
          status: 'OPEN',
          mayorValidationStatus: 'APPROVED',
          mayorValidatedById: user.id,
          mayorValidatedAt: new Date(),
          mayorComment: body.comment,
        },
      });
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/v1/mayor/locations/:id/reject',
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      requireRole(user, 'MAIRE');
      const body = mayorDecisionSchema.parse(request.body ?? {});

      const location = await prisma.location.findUnique({ where: { id: request.params.id } });
      if (!location) return reply.status(404).send({ error: 'Location not found' });
      if (location.status !== 'PENDING_VALIDATION') {
        return reply.status(400).send({ error: 'Location is not pending validation' });
      }

      return prisma.location.update({
        where: { id: request.params.id },
        data: {
          status: 'CLOSED',
          mayorValidationStatus: 'REJECTED',
          mayorValidatedById: user.id,
          mayorValidatedAt: new Date(),
          mayorComment: body.comment,
        },
      });
    },
  );
}
