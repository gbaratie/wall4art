import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import {
  createLocationSchema,
  locationSearchSchema,
  updateLocationSchema,
} from '@wall4art/shared';
import { prisma } from '../lib/prisma.js';
import { haversineKm, resolveLocationStatus } from '../lib/location-utils.js';
import { getSessionUser, requireAuth, requireRole } from '../lib/session.js';

const locationSelect = {
  id: true,
  hostId: true,
  title: true,
  description: true,
  expectedOutcome: true,
  kind: true,
  requiresMayorValidation: true,
  mayorValidationStatus: true,
  mayorValidatedAt: true,
  mayorComment: true,
  address: true,
  city: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  photoUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  host: { select: { id: true, name: true } },
  _count: { select: { proposals: true } },
} satisfies Prisma.LocationSelect;

export async function locationRoutes(app: FastifyInstance) {
  app.post('/api/v1/locations', async (request, reply) => {
    const user = requireAuth(await getSessionUser(request));
    requireRole(user, 'PARTICULIER');

    const body = createLocationSchema.parse(request.body);
    const { status, mayorValidationStatus } = resolveLocationStatus({
      publish: body.publish,
      kind: body.kind,
      requiresMayorValidation: body.requiresMayorValidation,
    });

    const location = await prisma.location.create({
      data: {
        hostId: user.id,
        title: body.title,
        description: body.description,
        expectedOutcome: body.expectedOutcome,
        kind: body.kind,
        requiresMayorValidation: body.requiresMayorValidation,
        mayorValidationStatus,
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        latitude: body.latitude,
        longitude: body.longitude,
        photoUrl: body.photoUrl,
        status,
      },
      select: locationSelect,
    });

    return reply.status(201).send(location);
  });

  app.get('/api/v1/locations', async (request) => {
    const user = await getSessionUser(request);
    const query = locationSearchSchema.parse(request.query);

    const where: Prisma.LocationWhereInput = {};

    if (query.mine && user) {
      where.hostId = user.id;
    } else {
      where.status = query.status ?? 'OPEN';
    }

    if (query.kind) where.kind = query.kind;

    let locations = await prisma.location.findMany({
      where,
      select: locationSelect,
      orderBy: { createdAt: 'desc' },
    });

    if (query.latitude != null && query.longitude != null && query.radiusKm != null) {
      locations = locations
        .map((loc) => ({
          ...loc,
          distanceKm: haversineKm(
            query.latitude!,
            query.longitude!,
            loc.latitude,
            loc.longitude,
          ),
        }))
        .filter((loc) => loc.distanceKm <= query.radiusKm!)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return locations;
  });

  app.get<{ Params: { id: string } }>('/api/v1/locations/:id', async (request, reply) => {
    const location = await prisma.location.findUnique({
      where: { id: request.params.id },
      select: {
        ...locationSelect,
        proposals: {
          select: {
            id: true,
            title: true,
            status: true,
            artist: { select: { id: true, name: true } },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!location) return reply.status(404).send({ error: 'Location not found' });
    return location;
  });

  app.patch<{ Params: { id: string } }>('/api/v1/locations/:id', async (request, reply) => {
    const user = requireAuth(await getSessionUser(request));
    const body = updateLocationSchema.parse(request.body);

    const existing = await prisma.location.findUnique({ where: { id: request.params.id } });
    if (!existing) return reply.status(404).send({ error: 'Location not found' });
    if (existing.hostId !== user.id) return reply.status(403).send({ error: 'Forbidden' });

    const publish = body.publish ?? false;
    const kind = body.kind ?? existing.kind;
    const requiresMayorValidation =
      body.requiresMayorValidation ?? existing.requiresMayorValidation;

    const resolved =
      publish && existing.status === 'DRAFT'
        ? resolveLocationStatus({ publish, kind, requiresMayorValidation })
        : null;

    const location = await prisma.location.update({
      where: { id: request.params.id },
      data: {
        ...body,
        ...(resolved
          ? { status: resolved.status, mayorValidationStatus: resolved.mayorValidationStatus }
          : {}),
      },
      select: locationSelect,
    });

    return location;
  });
}
