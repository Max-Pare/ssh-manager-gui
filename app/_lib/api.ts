import type { Device, Settings } from './ssh-manager-data';

export const API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3001';

export const WS_URL = API_URL.replace(/^http/, 'ws');

// The API token is entered by the operator at runtime and kept in localStorage.
// It is deliberately NOT baked into the JS bundle via NEXT_PUBLIC_* — anything
// in the bundle is readable by anyone who can load the page.
const TOKEN_KEY = 'ssh-mgr:token';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

// Validate a token against the backend without storing it.
export async function checkAuth(token: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/auth/check`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Terminal WebSocket URL. Browsers can't set headers on the WS handshake, so a
// single-use short-lived ticket (never the API token) rides in the query string.
export async function terminalWsUrl(deviceId: number): Promise<string> {
  const { ticket } = await apiFetch<{ ticket: string }>('/api/auth/ws-ticket', { method: 'POST' });
  return `${WS_URL}/ws/terminal/${deviceId}?ticket=${encodeURIComponent(ticket)}`;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options?.headers },
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    // Token revoked or wrong — let the auth gate drop back to the login screen.
    window.dispatchEvent(new Event('ssh-mgr:unauthorized'));
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error ?? msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  devices: {
    list(params?: { env?: string; group?: string; q?: string }) {
      const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== '') as [string, string][];
      const qs = entries.length ? '?' + new URLSearchParams(entries) : '';
      return apiFetch<Device[]>(`/api/devices${qs}`);
    },
    get: (id: number) => apiFetch<Device>(`/api/devices/${id}`),
    create: (data: Omit<Partial<Device>, 'id'> & { name: string; hostname: string }) =>
      apiFetch<Device>('/api/devices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Device>) =>
      apiFetch<Device>(`/api/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      apiFetch<{ ok: boolean }>(`/api/devices/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: number[]) =>
      apiFetch<{ ok: boolean; deleted: number }>('/api/devices', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
    import: (config: string) =>
      apiFetch<{ imported: number; devices: Device[] }>('/api/devices/import', {
        method: 'POST',
        body: JSON.stringify({ config }),
      }),
    async export() {
      const res = await fetch(`${API_URL}/api/devices/export`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Export failed');
      return res.text();
    },
    poll: (id: number) =>
      apiFetch<Device>(`/api/devices/${id}/poll`, { method: 'POST' }),
    pollAll: () =>
      apiFetch<{ ok: boolean }>('/api/devices/poll', { method: 'POST' }),
  },
  settings: {
    get: () => apiFetch<Settings>('/api/settings'),
    update: (data: Partial<Settings>) =>
      apiFetch<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
