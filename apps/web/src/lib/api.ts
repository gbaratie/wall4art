import { ApiError, type ApiErrorDetail } from './errors';

const apiUrl = import.meta.env.VITE_API_URL || '';

export function apiPath(path: string): string {
  if (apiUrl) return `${apiUrl}${path}`;
  return path;
}

type ErrorPayload =
  | string
  | { code?: string; message?: string; details?: ApiErrorDetail[] };

function parseErrorBody(body: unknown, status: number): ApiError {
  const fallback = new ApiError(status, {
    code: 'REQUEST_FAILED',
    message: 'La requête a échoué',
  });

  if (!body || typeof body !== 'object' || !('error' in body)) return fallback;

  const raw = (body as { error: ErrorPayload }).error;
  if (typeof raw === 'string') {
    return new ApiError(status, { code: 'REQUEST_FAILED', message: raw });
  }
  if (raw && typeof raw === 'object') {
    return new ApiError(status, {
      code: raw.code ?? 'REQUEST_FAILED',
      message: raw.message ?? 'La requête a échoué',
      details: raw.details,
    });
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiPath(path), {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseErrorBody(body, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
