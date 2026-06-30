export type EnvironmentId = 'prod' | 'staging' | 'dev';
export type DeviceStatus = 'online' | 'offline';

export type Device = {
  id: number;
  name: string;
  hostname: string;
  ip: string;
  status: DeviceStatus;
  env: EnvironmentId;
  group: string;
  tags: string[];
  os: string;
  cpu: number;
  ram: number;
  uptime: string;
  lastSeen: string | null;
  authType: 'key' | 'pass';
  port: number;
  user: string;
  keyPath?: string | null;
  password?: null;
  createdAt?: string;
};

export type Settings = {
  autoReconnect: boolean;
  connectionTimeoutSecs: number;
  serverAliveIntervalSecs: number;
  strictHostKeyChecking: boolean;
  pollIntervalSecs: number;
  envOrder: EnvironmentId[];
};

export type EnvironmentMeta = {
  label: string;
  color: string;
  background: string;
};

export const environmentMeta: Record<EnvironmentId, EnvironmentMeta> = {
  prod:    { label: 'Production',  color: '#f97316', background: 'rgba(249,115,22,.1)' },
  staging: { label: 'Staging',     color: '#58a6ff', background: 'rgba(88,166,255,.1)' },
  dev:     { label: 'Development', color: '#bc8cff', background: 'rgba(188,140,255,.1)' },
};

export function resourceColor(percent: number, kind: 'cpu' | 'ram'): string {
  if (kind === 'cpu') return percent > 80 ? '#f85149' : percent > 60 ? '#e3b341' : '#3fb950';
  return percent > 85 ? '#f85149' : percent > 70 ? '#e3b341' : '#58a6ff';
}

export function groupsForEnvironment(devices: Device[], env: EnvironmentId) {
  const envDevices = devices.filter((d) => d.env === env);
  return [...new Set(envDevices.map((d) => d.group))].map((group) => ({
    id: group,
    label: group,
    count: envDevices.filter((d) => d.group === group).length,
    onlineCount: envDevices.filter((d) => d.group === group && d.status === 'online').length,
  }));
}

export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'never';
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
