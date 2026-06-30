'use client';

import { Device, environmentMeta, formatLastSeen, resourceColor } from '@/app/_lib/ssh-manager-data';

type Props = {
  device: Device;
  onConnect: (device: Device) => void;
  onEdit: (device: Device) => void;
  onDelete: (id: number) => void;
  onPoll: (id: number) => void;
  onClose: () => void;
};

export function DeviceDetailPanel({ device, onConnect, onEdit, onDelete, onPoll, onClose }: Props) {
  const online = device.status === 'online';
  const env = environmentMeta[device.env];

  return (
    <aside className="absolute bottom-0 right-0 top-0 z-10 w-[284px] overflow-y-auto border-l border-ssh-border bg-ssh-sidebar">
      <section className="ssh-section-border px-4 py-3.5">
        <div className="mb-1.5 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: online ? '#3fb950' : '#f85149' }}
              />
              <h2 className="text-[15px] font-semibold text-ssh-heading">{device.name}</h2>
            </div>
            <p className="max-w-[228px] truncate pl-3 text-[11px] text-ssh-muted">
              {device.user}@{device.hostname}
            </p>
          </div>
          <button className="text-sm text-ssh-muted-dark hover:text-ssh-text" onClick={onClose}>x</button>
        </div>
        <div className="flex gap-1.5 pl-3">
          <span
            className={`rounded-[2px] px-1.5 py-0.5 text-[11px] ${
              online ? 'bg-ssh-green/10 text-ssh-green' : 'bg-ssh-red/10 text-ssh-red'
            }`}
          >
            {device.status}
          </span>
          <Badge background={env.background} color={env.color}>{env.label}</Badge>
        </div>
      </section>

      <section className="ssh-section-border flex gap-1.5 px-4 py-2.5">
        <button className="ssh-button-success flex-1 py-1.5" onClick={() => onConnect(device)}>
          connect
        </button>
        <button className="ssh-button-muted" onClick={() => onEdit(device)}>edit</button>
        <button className="ssh-button-muted" onClick={() => onPoll(device.id)} title="poll now">↻</button>
        <button className="ssh-button-danger py-1.5 px-2" onClick={() => {
          if (confirm(`Delete ${device.name}?`)) onDelete(device.id);
        }}>del</button>
      </section>

      <DetailSection title="resources">
        <ResourceDetail label="cpu" value={online ? device.cpu : 0} valueLabel={online ? `${device.cpu}%` : 'N/A'} kind="cpu" />
        <ResourceDetail label="ram" value={online ? device.ram : 0} valueLabel={online ? `${device.ram}%` : 'N/A'} kind="ram" />
        <KeyValue label="uptime" value={device.uptime || '—'} />
      </DetailSection>

      <DetailSection title="connection">
        <KeyValue label="host" value={device.hostname} />
        <KeyValue label="ip" value={device.ip} />
        <KeyValue label="port" value={String(device.port)} />
        <KeyValue label="user" value={device.user} />
        <KeyValue label="auth" value={device.authType === 'key' ? 'SSH key' : 'password'} />
        <KeyValue label="os" value={device.os || '—'} />
      </DetailSection>

      <section className="px-4 py-3">
        <SectionTitle>tags</SectionTitle>
        <div className="flex flex-wrap gap-1">
          {device.tags.length > 0
            ? device.tags.map((tag) => <span key={tag} className="ssh-chip">{tag}</span>)
            : <span className="text-[11px] text-ssh-dim">no tags</span>}
        </div>
        <p className="mt-2.5 text-[11px] text-ssh-muted-dark">last seen {formatLastSeen(device.lastSeen)}</p>
      </section>
    </aside>
  );
}

function DetailSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="ssh-section-border px-4 py-3">
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="ssh-section-title">{children}</div>;
}

function ResourceDetail({ kind, label, value, valueLabel }: { kind: 'cpu' | 'ram'; label: string; value: number; valueLabel: string }) {
  const color = resourceColor(value, kind);
  return (
    <div className="mb-1.5">
      <div className="mb-1 flex justify-between">
        <span className="text-[12px] text-ssh-soft">{label}</span>
        <span className="text-[12px]" style={{ color }}>{valueLabel}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-sm bg-ssh-border-soft">
        <div className="h-full rounded-sm" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="ssh-key-label">{label}</span>
      <span className="ssh-key-value">{value}</span>
    </div>
  );
}

function Badge({ background, children, color }: { background: string; children: React.ReactNode; color: string }) {
  return (
    <span className="rounded-[2px] px-1.5 py-0.5 text-[11px]" style={{ backgroundColor: background, color }}>
      {children}
    </span>
  );
}
