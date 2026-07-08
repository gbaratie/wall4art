import type { FastifyInstance } from 'fastify';
import { uploadImage } from '../lib/cloudinary.js';
import { getSessionUser, requireAuth } from '../lib/session.js';

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/v1/uploads/image', async (request, reply) => {
    requireAuth(await getSessionUser(request));

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({ error: 'File too large (max 10MB)' });
    }

    const result = await uploadImage(buffer, 'wall4art');
    return { url: result.url, publicId: result.publicId };
  });
}
