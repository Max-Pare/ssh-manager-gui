import type { Device, Settings } from './ssh-manager-data';

export const API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3001';

export const WS_URL = API_URL.replace(/^http/, 'ws');

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
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
      const res = await fetch(`${API_URL}/api/devices/export`);
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
