import type { FastifyInstance } from 'fastify';
import { registerSchema, updateProfileSchema } from '@wall4art/shared';
import { auth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { sendError } from '../lib/errors.js';
import { getSessionUser, requireAuth } from '../lib/session.js';
import { geocodeCity } from '../lib/geocoding.js';
import type { UserRole } from '@prisma/client';

const userInclude = {
  roles: { select: { role: true } },
  profile: true,
};

function formatUser(user: {
  id: string;
  email: string;
  name: string;
  image: string | null;
  roles: { role: UserRole }[];
  profile: {
    bio: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    searchRadiusKm: number;
    portfolioLinks: unknown;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    roles: user.roles.map((r) => r.role),
    profile: user.profile,
  };
}

export async function profileRoutes(app: FastifyInstance) {
  app.post('/api/v1/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return sendError(reply, 409, 'EMAIL_ALREADY_REGISTERED');

    const result = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });

    if (!result?.user) return sendError(reply, 400, 'REGISTRATION_FAILED');

    await prisma.userRoleAssignment.createMany({
      data: body.roles.map((role) => ({ userId: result.user.id, role })),
    });

    await prisma.profile.create({
      data: { userId: result.user.id },
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: result.user.id },
      include: userInclude,
    });

    return reply.status(201).send(formatUser(user));
  });

  app.get('/api/v1/me', async (request, reply) => {
    const sessionUser = requireAuth(await getSessionUser(request));
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: userInclude,
    });
    if (!user) return sendError(reply, 404, 'USER_NOT_FOUND');
    return formatUser(user);
  });

  app.patch('/api/v1/me', async (request, reply) => {
    const sessionUser = requireAuth(await getSessionUser(request));
    const body = updateProfileSchema.parse(request.body);

    if (body.name) {
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: { name: body.name },
      });
    }

    const { name: _name, ...profileData } = body;
    if (Object.keys(profileData).length > 0) {
      const data = { ...profileData };

      if (data.city) {
        const coords = await geocodeCity(data.city);
        Object.assign(data, coords);
      }

      await prisma.profile.upsert({
        where: { userId: sessionUser.id },
        create: { userId: sessionUser.id, ...data },
        update: data,
      });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      include: userInclude,
    });

    return formatUser(user);
  });

  app.get<{ Params: { id: string } }>('/api/v1/artists/:id', async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.params.id },
      include: userInclude,
    });
    if (!user) return sendError(reply, 404, 'ARTIST_NOT_FOUND');
    if (!user.roles.some((r) => r.role === 'ARTISTE')) {
      return sendError(reply, 404, 'ARTIST_NOT_FOUND');
    }
    return formatUser(user);
  });
}
