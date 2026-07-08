import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { profileRoutes } from './routes/profiles.js';
import { locationRoutes } from './routes/locations.js';
import { mayorRoutes } from './routes/mayor.js';
import { proposalRoutes } from './routes/proposals.js';
import { conversationRoutes } from './routes/conversations.js';
import { uploadRoutes } from './routes/uploads.js';

const port = Number(process.env.PORT ?? 3002);
const host = '0.0.0.0';

const app = Fastify({ logger: true });

const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

function isLocalDevOrigin(origin: string) {
  return /^https?:\/\/localhost(:\d+)?$/.test(origin);
}

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'development' && isLocalDevOrigin(origin)) {
      return callback(null, true);
    }
    if (corsOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
});

await app.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.setErrorHandler((error: unknown, _request, reply) => {
  const err = error as Error & { statusCode?: number; name?: string };
  const statusCode = err.statusCode ?? (err.name === 'ZodError' ? 400 : 500);
  app.log.error(error);
  reply.status(statusCode).send({
    error: err.message ?? 'Internal Server Error',
  });
});

app.get('/health', async () => ({ status: 'ok' }));

const authHandler = toNodeHandler(auth);

await app.register(async function authRoutes(app) {
  // Let Better Auth read the raw body — Fastify must not consume the stream first.
  app.addContentTypeParser('application/json', (_request, _payload, done) => {
    done(null, null);
  });
  app.addContentTypeParser('application/x-www-form-urlencoded', (_request, _payload, done) => {
    done(null, null);
  });

  app.all('/api/auth/*', async (request, reply) => {
    await authHandler(request.raw, reply.raw);
  });
});

await app.register(profileRoutes);
await app.register(locationRoutes);
await app.register(mayorRoutes);
await app.register(proposalRoutes);
await app.register(conversationRoutes);
await app.register(uploadRoutes);

try {
  await app.listen({ port, host });
  console.log(`API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
