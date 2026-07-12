import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerOpenApi(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Wall4Art API',
        description:
          'API REST pour la plateforme Wall4Art — lieux, propositions d\'œuvres, messagerie et validation mairie. L\'authentification utilise Better Auth via cookies de session.',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3002', description: 'Développement local' }],
      tags: [
        { name: 'Profils', description: 'Inscription et profil utilisateur' },
        { name: 'Lieux', description: 'Création et recherche de lieux' },
        { name: 'Propositions', description: 'Propositions d\'œuvres par les artistes' },
        { name: 'Mairie', description: 'Validation des lieux publics' },
        { name: 'Messagerie', description: 'Conversations entre hôtes et artistes' },
        { name: 'Uploads', description: 'Téléversement d\'images' },
        { name: 'Géocodage', description: 'Recherche d\'adresses' },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'better-auth.session_token',
            description: 'Session Better Auth (cookie httpOnly)',
          },
        },
        schemas: {
          ApiError: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'VALIDATION_ERROR' },
                  message: { type: 'string', example: 'Données invalides' },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
                required: ['code', 'message'],
              },
            },
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}
