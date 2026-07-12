import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export type ErrorDetail = { field: string; message: string };

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: ErrorDetail[];
};

export class HttpError extends Error {
  statusCode: number;
  code: string;
  details?: ErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const FIELD_LABELS: Record<string, string> = {
  title: 'titre',
  description: 'description',
  commitments: 'engagements',
  estimatedDurationDays: 'durée estimée',
  sketchUrl: 'croquis',
  fundingRequested: 'demande de financement',
  fundingAmount: 'montant',
  fundingDescription: 'description du financement',
  email: 'email',
  password: 'mot de passe',
  name: 'nom',
  content: 'message',
  status: 'statut',
};

const ZOD_MESSAGES: Record<string, string> = {
  'String must contain at least': 'Ce champ est trop court',
  'String must contain at most': 'Ce champ est trop long',
  'Invalid email': 'Adresse email invalide',
  'Expected number': 'Nombre attendu',
  'Expected boolean': 'Valeur booléenne attendue',
  'Invalid url': 'URL invalide',
  'Required': 'Ce champ est requis',
};

function humanizeZodMessage(message: string, field: string): string {
  const label = FIELD_LABELS[field] ?? field;
  for (const [pattern, fr] of Object.entries(ZOD_MESSAGES)) {
    if (message.includes(pattern)) {
      if (message.includes('at least')) {
        const match = message.match(/at least (\d+)/);
        return `Le champ « ${label} » doit contenir au moins ${match?.[1] ?? ''} caractères`;
      }
      if (message.includes('at most')) {
        const match = message.match(/at most (\d+)/);
        return `Le champ « ${label} » ne doit pas dépasser ${match?.[1] ?? ''} caractères`;
      }
      return `${fr} (champ « ${label} »)`;
    }
  }
  return `Le champ « ${label} » est invalide`;
}

export function formatZodError(error: ZodError): HttpError {
  const details = error.errors.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: humanizeZodMessage(issue.message, issue.path.join('.')),
  }));
  return new HttpError(400, 'VALIDATION_ERROR', 'Données invalides', details);
}

export const ErrorMessages = {
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action',
  FORBIDDEN: 'Vous n\'avez pas les droits pour effectuer cette action',
  NOT_FOUND: 'Ressource introuvable',
  LOCATION_NOT_FOUND: 'Lieu introuvable',
  PROPOSAL_NOT_FOUND: 'Proposition introuvable',
  USER_NOT_FOUND: 'Utilisateur introuvable',
  ARTIST_NOT_FOUND: 'Artiste introuvable',
  CONVERSATION_NOT_FOUND: 'Conversation introuvable',
  LOCATION_NOT_OPEN: 'Ce lieu n\'accepte pas de nouvelles propositions',
  LOCATION_NOT_PENDING: 'Ce lieu n\'est pas en attente de validation',
  PROPOSAL_ALREADY_EXISTS: 'Vous avez déjà soumis une proposition pour ce lieu',
  PROPOSAL_NOT_EDITABLE: 'Cette proposition ne peut plus être modifiée',
  EMAIL_ALREADY_REGISTERED: 'Cet email est déjà utilisé',
  REGISTRATION_FAILED: 'Inscription impossible',
  NO_FILE: 'Aucun fichier envoyé',
  FILE_TOO_LARGE: 'Fichier trop volumineux (max 10 Mo)',
  GEOCODING_UNAVAILABLE: 'Service de géolocalisation indisponible',
  INTERNAL: 'Une erreur interne est survenue',
} as const;

export function httpError(
  statusCode: number,
  code: keyof typeof ErrorMessages | string,
  message?: string,
  details?: ErrorDetail[],
): HttpError {
  const resolved =
    message ??
    (code in ErrorMessages ? ErrorMessages[code as keyof typeof ErrorMessages] : ErrorMessages.INTERNAL);
  return new HttpError(statusCode, code, resolved, details);
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: keyof typeof ErrorMessages | string,
  message?: string,
  details?: ErrorDetail[],
) {
  const err = httpError(statusCode, code, message, details);
  return reply.status(statusCode).send({ error: toErrorBody(err) });
}

export function toErrorBody(err: HttpError): ApiErrorBody {
  return {
    code: err.code,
    message: err.message,
    ...(err.details?.length ? { details: err.details } : {}),
  };
}

export function normalizeError(error: unknown): { statusCode: number; body: ApiErrorBody } {
  if (error instanceof HttpError) {
    return { statusCode: error.statusCode, body: toErrorBody(error) };
  }

  if (error instanceof ZodError) {
    const formatted = formatZodError(error);
    return { statusCode: formatted.statusCode, body: toErrorBody(formatted) };
  }

  const err = error as Error & { statusCode?: number };
  if (err.statusCode) {
    if (err.statusCode === 401) {
      return { statusCode: 401, body: { code: 'UNAUTHORIZED', message: ErrorMessages.UNAUTHORIZED } };
    }
    if (err.statusCode === 403) {
      return { statusCode: 403, body: { code: 'FORBIDDEN', message: ErrorMessages.FORBIDDEN } };
    }
    return {
      statusCode: err.statusCode,
      body: { code: 'INTERNAL', message: err.message || ErrorMessages.INTERNAL },
    };
  }

  return {
    statusCode: 500,
    body: { code: 'INTERNAL', message: ErrorMessages.INTERNAL },
  };
}
