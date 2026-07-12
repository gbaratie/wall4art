import type { FastifyInstance } from 'fastify';
import { createConversationSchema, createMessageSchema } from '@wall4art/shared';
import { prisma } from '../lib/prisma.js';
import { sendError } from '../lib/errors.js';
import { getSessionUser, requireAuth } from '../lib/session.js';

export async function conversationRoutes(app: FastifyInstance) {
  app.get('/api/v1/conversations', async (request) => {
    const user = requireAuth(await getSessionUser(request));

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ hostId: user.id }, { artistId: user.id }],
      },
      include: {
        location: { select: { id: true, title: true, city: true } },
        host: { select: { id: true, name: true } },
        artist: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations;
  });

  app.post('/api/v1/conversations', async (request, reply) => {
    const user = requireAuth(await getSessionUser(request));
    const body = createConversationSchema.parse(request.body);

    const location = await prisma.location.findUnique({ where: { id: body.locationId } });
    if (!location) return sendError(reply, 404, 'LOCATION_NOT_FOUND');

    const artistId = body.artistId ?? user.id;
    const isHost = location.hostId === user.id;
    const isArtist = artistId === user.id;

    if (!isHost && !isArtist) return sendError(reply, 403, 'FORBIDDEN');

    const conversation = await prisma.conversation.upsert({
      where: {
        locationId_artistId: { locationId: location.id, artistId },
      },
      create: {
        locationId: location.id,
        hostId: location.hostId,
        artistId,
      },
      update: {},
      include: {
        location: { select: { id: true, title: true } },
        host: { select: { id: true, name: true } },
        artist: { select: { id: true, name: true } },
      },
    });

    return reply.status(201).send(conversation);
  });

  app.get<{ Params: { id: string } }>(
    '/api/v1/conversations/:id/messages',
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      const conversation = await prisma.conversation.findUnique({
        where: { id: request.params.id },
      });
      if (!conversation) return sendError(reply, 404, 'CONVERSATION_NOT_FOUND');
      if (conversation.hostId !== user.id && conversation.artistId !== user.id) {
        return sendError(reply, 403, 'FORBIDDEN');
      }

      return prisma.message.findMany({
        where: { conversationId: conversation.id },
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/v1/conversations/:id/messages',
    async (request, reply) => {
      const user = requireAuth(await getSessionUser(request));
      const body = createMessageSchema.parse(request.body);

      const conversation = await prisma.conversation.findUnique({
        where: { id: request.params.id },
      });
      if (!conversation) return sendError(reply, 404, 'CONVERSATION_NOT_FOUND');
      if (conversation.hostId !== user.id && conversation.artistId !== user.id) {
        return sendError(reply, 403, 'FORBIDDEN');
      }

      const message = await prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: user.id,
            content: body.content,
          },
          include: { sender: { select: { id: true, name: true } } },
        });
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
        return created;
      });

      return reply.status(201).send(message);
    },
  );
}
