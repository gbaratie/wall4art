const apiUrl = import.meta.env.VITE_API_URL || '';

export function apiPath(path: string): string {
  if (apiUrl) return `${apiUrl}${path}`;
  return path;
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
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? 'Request failed');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
