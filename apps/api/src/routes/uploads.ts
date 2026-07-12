import type { FastifyInstance } from 'fastify';
import { uploadImage } from '../lib/cloudinary.js';
import { sendError } from '../lib/errors.js';
import { getSessionUser, requireAuth } from '../lib/session.js';

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/v1/uploads/image', async (request, reply) => {
    requireAuth(await getSessionUser(request));

    const data = await request.file();
    if (!data) return sendError(reply, 400, 'NO_FILE');

    const buffer = await data.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      return sendError(reply, 400, 'FILE_TOO_LARGE');
    }

    try {
      const result = await uploadImage(buffer, 'wall4art');
      return { url: result.url, publicId: result.publicId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec du téléversement';
      return sendError(reply, 400, 'INTERNAL', message);
    }
  });
}
