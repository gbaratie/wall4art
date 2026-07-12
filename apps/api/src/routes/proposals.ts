import type { FastifyInstance } from 'fastify';
import {
  createProposalSchema,
  updateProposalSchema,
  updateProposalStatusSchema,
} from '@wall4art/shared';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { prisma } from '../lib/prisma.js';
import { sendError } from '../lib/errors.js';
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

const EDITABLE_STATUSES = ['DRAFT', 'SUBMITTED'] as const;

const errorResponse = {
  description: 'Erreur API',
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: { field: { type: 'string' }, message: { type: 'string' } },
          },
        },
      },
    },
  },
};

function canViewProposal(
  proposal: { artistId: string; location: { hostId: string } },
  user: { id: string; roles: string[] },
) {
  return (
    proposal.artistId === user.id ||
    proposal.location.hostId === user.id ||
    user.roles.includes('MAIRE')
  );
}

export async function proposalRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    '/api/v1/locations/:id/proposals',
    {
      schema: {
        tags: ['Propositions'],
        summary: 'Soumettre une proposition sur un lieu',
        security: [{ cookieAuth: [] }],
        body: zodToJsonSchema(createProposalSchema, { $refStrategy: 'none' }),
        response: { 400: errorResponse, 409: errorResponse },
      },
    },
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      requireRole(user, 'ARTISTE');
      const body = createProposalSchema.parse(request.body);

      const location = await prisma.location.findUnique({ where: { id: request.params.id } });
      if (!location) return sendError(reply, 404, 'LOCATION_NOT_FOUND');
      if (location.status !== 'OPEN') {
        return sendError(reply, 400, 'LOCATION_NOT_OPEN');
      }

      const existing = await prisma.artworkProposal.findFirst({
        where: { locationId: location.id, artistId: user.id },
      });
      if (existing) {
        return sendError(reply, 409, 'PROPOSAL_ALREADY_EXISTS');
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

  app.get<{ Params: { id: string } }>(
    '/api/v1/proposals/:id',
    {
      schema: {
        tags: ['Propositions'],
        summary: 'Détail d\'une proposition',
        security: [{ cookieAuth: [] }],
        response: { 403: errorResponse, 404: errorResponse },
      },
    },
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));

      const proposal = await prisma.artworkProposal.findUnique({
        where: { id: request.params.id },
        select: proposalSelect,
      });
      if (!proposal) return sendError(reply, 404, 'PROPOSAL_NOT_FOUND');
      if (!canViewProposal(proposal, user)) {
        return sendError(reply, 403, 'FORBIDDEN');
      }

      return proposal;
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/api/v1/proposals/:id',
    {
      schema: {
        tags: ['Propositions'],
        summary: 'Modifier une proposition',
        security: [{ cookieAuth: [] }],
        body: zodToJsonSchema(updateProposalSchema, { $refStrategy: 'none' }),
        response: { 400: errorResponse, 403: errorResponse, 404: errorResponse },
      },
    },
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      requireRole(user, 'ARTISTE');
      const body = updateProposalSchema.parse(request.body);

      const proposal = await prisma.artworkProposal.findUnique({
        where: { id: request.params.id },
        include: { location: true },
      });
      if (!proposal) return sendError(reply, 404, 'PROPOSAL_NOT_FOUND');
      if (proposal.artistId !== user.id) return sendError(reply, 403, 'FORBIDDEN');
      if (!EDITABLE_STATUSES.includes(proposal.status as (typeof EDITABLE_STATUSES)[number])) {
        return sendError(reply, 400, 'PROPOSAL_NOT_EDITABLE');
      }

      const { submit, ...fields } = body;
      const data: Record<string, unknown> = { ...fields };

      if (submit === true && proposal.status === 'DRAFT') {
        data.status = 'SUBMITTED';
      }

      const updated = await prisma.artworkProposal.update({
        where: { id: proposal.id },
        data,
        select: proposalSelect,
      });

      return updated;
    },
  );

  app.get<{ Params: { locationId: string } }>(
    '/api/v1/locations/:locationId/proposals',
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      const location = await prisma.location.findUnique({
        where: { id: request.params.locationId },
      });
      if (!location) return sendError(reply, 404, 'LOCATION_NOT_FOUND');
      if (location.hostId !== user.id && !user.roles.includes('MAIRE')) {
        return sendError(reply, 403, 'FORBIDDEN');
      }

      return prisma.artworkProposal.findMany({
        where: { locationId: location.id },
        select: proposalSelect,
        orderBy: { createdAt: 'desc' },
      });
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/api/v1/proposals/:id/status',
    {
      schema: {
        tags: ['Propositions'],
        summary: 'Changer le statut d\'une proposition',
        security: [{ cookieAuth: [] }],
        body: zodToJsonSchema(updateProposalStatusSchema, { $refStrategy: 'none' }),
        response: { 403: errorResponse, 404: errorResponse },
      },
    },
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      const body = updateProposalStatusSchema.parse(request.body);

      const proposal = await prisma.artworkProposal.findUnique({
        where: { id: request.params.id },
        include: { location: true },
      });
      if (!proposal) return sendError(reply, 404, 'PROPOSAL_NOT_FOUND');

      const isHost = proposal.location.hostId === user.id;
      const isArtist = proposal.artistId === user.id;

      if (body.status === 'WITHDRAWN' && !isArtist) {
        return sendError(reply, 403, 'FORBIDDEN');
      }
      if (['ACCEPTED', 'REJECTED', 'UNDER_REVIEW'].includes(body.status) && !isHost) {
        return sendError(reply, 403, 'FORBIDDEN');
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
    },
  );
}
