const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch(path: string, token?: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Erro na API');
  }

  return res.json();
}

export const api = {
  get: (path: string, token?: string) => apiFetch(path, token),
  post: (path: string, body: unknown, token?: string) =>
    apiFetch(path, token, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body: unknown, token?: string) =>
    apiFetch(path, token, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string, token?: string) =>
    apiFetch(path, token, { method: 'DELETE' }),
};
