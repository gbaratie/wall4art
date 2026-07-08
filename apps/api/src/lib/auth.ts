import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3002';

const trustedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  user: {
    additionalFields: {
      roles: {
        type: 'string[]',
        required: false,
        defaultValue: [],
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
