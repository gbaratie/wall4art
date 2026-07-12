export type ApiErrorDetail = { field: string; message: string };

export class ApiError extends Error {
  code: string;
  status: number;
  details?: ApiErrorDetail[];

  constructor(
    status: number,
    body: { code: string; message: string; details?: ApiErrorDetail[] },
  ) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue';
}

export function getFieldErrors(error: unknown): ApiErrorDetail[] {
  if (error instanceof ApiError && error.details?.length) return error.details;
  return [];
}
