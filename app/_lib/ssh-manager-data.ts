export type EnvironmentId = "prod" | "staging" | "dev";

export type DeviceStatus = "online" | "offline";

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
  lastSeen: string;
  authType: "key" | "pass";
  port: number;
  user: string;
};

export type EnvironmentMeta = {
  label: string;
  color: string;
  background: string;
};

export const environmentOrder: EnvironmentId[] = ["prod", "staging", "dev"];

export const environmentMeta: Record<EnvironmentId, EnvironmentMeta> = {
  prod: {
    label: "Production",
    color: "#f97316",
    background: "rgba(249,115,22,.1)",
  },
  staging: {
    label: "Staging",
    color: "#58a6ff",
    background: "rgba(88,166,255,.1)",
  },
  dev: {
    label: "Development",
    color: "#bc8cff",
    background: "rgba(188,140,255,.1)",
  },
};

export const devices: Device[] = [
  {
    id: 1,
    name: "prod-api-01",
    hostname: "api-01.prod.example.com",
    ip: "10.0.1.12",
    status: "online",
    env: "prod",
    group: "api",
    tags: ["node", "critical"],
    os: "Ubuntu 22.04",
    cpu: 24,
    ram: 71,
    uptime: "31d 4h",
    lastSeen: "Just now",
    authType: "key",
    port: 22,
    user: "ubuntu",
  },
  {
    id: 2,
    name: "prod-api-02",
    hostname: "api-02.prod.example.com",
    ip: "10.0.1.13",
    status: "online",
    env: "prod",
    group: "api",
    tags: ["node", "critical"],
    os: "Ubuntu 22.04",
    cpu: 67,
    ram: 82,
    uptime: "28d 11h",
    lastSeen: "Just now",
    authType: "key",
    port: 22,
    user: "ubuntu",
  },
  {
    id: 3,
    name: "prod-db-01",
    hostname: "db-01.prod.example.com",
    ip: "10.0.2.10",
    status: "online",
    env: "prod",
    group: "databases",
    tags: ["postgres", "primary"],
    os: "Debian 12",
    cpu: 38,
    ram: 88,
    uptime: "45d 2h",
    lastSeen: "Just now",
    authType: "key",
    port: 22,
    user: "postgres",
  },
  {
    id: 4,
    name: "prod-cache",
    hostname: "redis.prod.example.com",
    ip: "10.0.3.5",
    status: "offline",
    env: "prod",
    group: "cache",
    tags: ["redis"],
    os: "Alpine 3.19",
    cpu: 0,
    ram: 0,
    uptime: "-",
    lastSeen: "2 hr ago",
    authType: "key",
    port: 22,
    user: "root",
  },
  {
    id: 5,
    name: "stg-api",
    hostname: "api.staging.example.com",
    ip: "10.1.1.12",
    status: "online",
    env: "staging",
    group: "api",
    tags: ["node"],
    os: "Ubuntu 22.04",
    cpu: 12,
    ram: 44,
    uptime: "4d 9h",
    lastSeen: "1 min ago",
    authType: "key",
    port: 22,
    user: "ubuntu",
  },
  {
    id: 6,
    name: "stg-worker",
    hostname: "worker.staging.example.com",
    ip: "10.1.1.30",
    status: "offline",
    env: "staging",
    group: "workers",
    tags: ["queue"],
    os: "Ubuntu 20.04",
    cpu: 0,
    ram: 0,
    uptime: "-",
    lastSeen: "1 day ago",
    authType: "pass",
    port: 2222,
    user: "deploy",
  },
  {
    id: 7,
    name: "stg-db",
    hostname: "db.staging.example.com",
    ip: "10.1.2.10",
    status: "online",
    env: "staging",
    group: "databases",
    tags: ["postgres"],
    os: "Debian 11",
    cpu: 8,
    ram: 38,
    uptime: "7d 2h",
    lastSeen: "2 hr ago",
    authType: "key",
    port: 22,
    user: "root",
  },
  {
    id: 8,
    name: "dev-station",
    hostname: "dev-01.local",
    ip: "192.168.1.50",
    status: "online",
    env: "dev",
    group: "dev-machines",
    tags: ["personal"],
    os: "Arch Linux",
    cpu: 45,
    ram: 62,
    uptime: "3d 8h",
    lastSeen: "Just now",
    authType: "key",
    port: 22,
    user: "alex",
  },
  {
    id: 9,
    name: "dev-laptop",
    hostname: "dev-02.local",
    ip: "192.168.1.51",
    status: "offline",
    env: "dev",
    group: "dev-machines",
    tags: ["personal"],
    os: "Fedora 39",
    cpu: 0,
    ram: 0,
    uptime: "-",
    lastSeen: "5 days ago",
    authType: "pass",
    port: 2222,
    user: "alex",
  },
  {
    id: 10,
    name: "pi-home",
    hostname: "raspberrypi.local",
    ip: "192.168.1.100",
    status: "online",
    env: "dev",
    group: "home",
    tags: ["rpi", "iot"],
    os: "Raspberry Pi OS",
    cpu: 18,
    ram: 55,
    uptime: "120d 4h",
    lastSeen: "30 min ago",
    authType: "key",
    port: 22,
    user: "pi",
  },
];

export const selectedDeviceIds = [1, 3];

export const activeDeviceId = 1;

export function resourceColor(percent: number, kind: "cpu" | "ram") {
  if (kind === "cpu") {
    return percent > 80 ? "#f85149" : percent > 60 ? "#e3b341" : "#3fb950";
  }

  return percent > 85 ? "#f85149" : percent > 70 ? "#e3b341" : "#58a6ff";
}

export function groupsForEnvironment(env: EnvironmentId) {
  const envDevices = devices.filter((device) => device.env === env);
  return [...new Set(envDevices.map((device) => device.group))].map((group) => ({
    id: group,
    label: group,
    count: envDevices.filter((device) => device.group === group).length,
  }));
}

export function deviceExportText() {
  return devices
    .map((device) => {
      const identity = device.authType === "key" ? "\n  IdentityFile ~/.ssh/id_rsa" : "";
      return `Host ${device.name}\n  HostName ${device.hostname}\n  User ${device.user}\n  Port ${device.port}${identity}`;
    })
    .join("\n\n");
}

export const terminalLines = [
  {
    prompt: "",
    text: "Connecting to ubuntu@api-01.prod.example.com...",
    color: "#4a5568",
  },
  {
    prompt: "",
    text: "Last login: Tue Jun 30 from 10.0.0.1",
    color: "#3d4147",
  },
  {
    prompt: "",
    text: "Ubuntu 22.04  *  uptime 31d 4h",
    color: "#3d4147",
  },
  {
    prompt: "ubuntu@prod-api-01:~$ ",
    text: "uptime",
    color: "#c9d1d9",
  },
  {
    prompt: "",
    text: " 11:15 up 31d 4h, 1 user, load: 0.48",
    color: "#c9d1d9",
  },
];
