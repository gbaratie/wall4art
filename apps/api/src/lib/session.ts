import type { FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { prisma } from './prisma.js';
import type { UserRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
};

export async function getSessionUser(request: FastifyRequest): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user) return null;

  const roles = await prisma.userRoleAssignment.findMany({
    where: { userId: session.user.id },
    select: { role: true },
  });

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles: roles.map((r) => r.role),
  };
}

export function hasRole(user: AuthUser, role: UserRole): boolean {
  return user.roles.includes(role);
}

export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    const error = new Error('Unauthorized');
    (error as Error & { statusCode: number }).statusCode = 401;
    throw error;
  }
  return user;
}

export function requireRole(user: AuthUser, role: UserRole): void {
  if (!hasRole(user, role)) {
    const error = new Error('Forbidden');
    (error as Error & { statusCode: number }).statusCode = 403;
    throw error;
  }
}
