import type { FastifyInstance } from 'fastify';
import { createProposalSchema, updateProposalStatusSchema } from '@wall4art/shared';
import { prisma } from '../lib/prisma.js';
import { getSessionUser, requireAuth, requireRole } from '../lib/session.js';

const proposalSelect = {
  id: true,
  artistId: true,
  locationId: true,
  title: true,
  description: true,
  commitments: true,
  estimatedDurationDays: true,
  sketchUrl: true,
  fundingRequested: true,
  fundingAmount: true,
  fundingDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  artist: { select: { id: true, name: true } },
  location: {
    select: {
      id: true,
      title: true,
      city: true,
      hostId: true,
      status: true,
    },
  },
};

export async function proposalRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    '/api/v1/locations/:id/proposals',
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      requireRole(user, 'ARTISTE');
      const body = createProposalSchema.parse(request.body);

      const location = await prisma.location.findUnique({ where: { id: request.params.id } });
      if (!location) return reply.status(404).send({ error: 'Location not found' });
      if (location.status !== 'OPEN') {
        return reply.status(400).send({ error: 'Location is not open for proposals' });
      }

      const existing = await prisma.artworkProposal.findFirst({
        where: { locationId: location.id, artistId: user.id },
      });
      if (existing) {
        return reply.status(409).send({ error: 'You already submitted a proposal for this location' });
      }

      const proposal = await prisma.artworkProposal.create({
        data: {
          artistId: user.id,
          locationId: location.id,
          title: body.title,
          description: body.description,
          commitments: body.commitments,
          estimatedDurationDays: body.estimatedDurationDays,
          sketchUrl: body.sketchUrl,
          fundingRequested: body.fundingRequested,
          fundingAmount: body.fundingAmount,
          fundingDescription: body.fundingDescription,
          status: body.submit ? 'SUBMITTED' : 'DRAFT',
        },
        select: proposalSelect,
      });

      await prisma.conversation.upsert({
        where: {
          locationId_artistId: { locationId: location.id, artistId: user.id },
        },
        create: {
          locationId: location.id,
          hostId: location.hostId,
          artistId: user.id,
        },
        update: {},
      });

      return reply.status(201).send(proposal);
    },
  );

  app.get('/api/v1/proposals/mine', async (request) => {
    const user = requireAuth(await getSessionUser(request));
    requireRole(user, 'ARTISTE');

    return prisma.artworkProposal.findMany({
      where: { artistId: user.id },
      select: proposalSelect,
      orderBy: { createdAt: 'desc' },
    });
  });

  app.get<{ Params: { locationId: string } }>(
    '/api/v1/locations/:locationId/proposals',
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      const location = await prisma.location.findUnique({
        where: { id: request.params.locationId },
      });
      if (!location) return reply.status(404).send({ error: 'Location not found' });
      if (location.hostId !== user.id && !user.roles.includes('MAIRE')) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      return prisma.artworkProposal.findMany({
        where: { locationId: location.id },
        select: proposalSelect,
        orderBy: { createdAt: 'desc' },
      });
    },
  );

  app.patch<{ Params: { id: string } }>('/api/v1/proposals/:id/status', async (request, reply) => {
    const user = requireAuth(await getSessionUser(request));
    const body = updateProposalStatusSchema.parse(request.body);

    const proposal = await prisma.artworkProposal.findUnique({
      where: { id: request.params.id },
      include: { location: true },
    });
    if (!proposal) return reply.status(404).send({ error: 'Proposal not found' });

    const isHost = proposal.location.hostId === user.id;
    const isArtist = proposal.artistId === user.id;

    if (body.status === 'WITHDRAWN' && !isArtist) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    if (['ACCEPTED', 'REJECTED', 'UNDER_REVIEW'].includes(body.status) && !isHost) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.artworkProposal.update({
        where: { id: proposal.id },
        data: { status: body.status },
        select: proposalSelect,
      });

      if (body.status === 'ACCEPTED') {
        await tx.location.update({
          where: { id: proposal.locationId },
          data: { status: 'MATCHED' },
        });
      }

      return result;
    });

    return updated;
  });
}
