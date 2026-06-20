const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type ApiErrorBody = {
  code?: string;
  message?: string | string[];
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('sticker-track-access-token');
      window.dispatchEvent(new Event('sticker-track-auth-state'));
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const err = new Error(error.code ?? (Array.isArray(error.message) ? error.message[0] : error.message) ?? 'UNKNOWN_ERROR');
    (err as any).status = response.status;
    throw err;
  }

  return response.json() as Promise<T>;
}

export function authenticatedApiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
) {
  return apiRequest<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });
}
