'use client';

import { Device, environmentMeta, resourceColor } from '@/app/_lib/ssh-manager-data';

type Props = {
  rows: Device[];
  activeDeviceId: number | null;
  selectedIds: Set<number>;
  onSelectDevice: (id: number) => void;
  onToggleSelect: (id: number) => void;
  onConnect: (device: Device) => void;
};

export function DeviceTable({ rows, activeDeviceId, selectedIds, onSelectDevice, onToggleSelect, onConnect }: Props) {
  return (
    <section className="relative h-full overflow-hidden">
      <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${activeDeviceId !== null ? 'pr-[288px]' : ''}`}>
        {rows.map((device) => (
          <DeviceRow
            key={device.id}
            device={device}
            active={device.id === activeDeviceId}
            selected={selectedIds.has(device.id)}
            onSelect={() => onSelectDevice(device.id)}
            onToggle={() => onToggleSelect(device.id)}
            onConnect={() => onConnect(device)}
          />
        ))}
        {rows.length === 0 && (
          <div className="flex h-32 items-center justify-center text-[13px] text-ssh-muted">
            no devices match filter
          </div>
        )}
      </div>
    </section>
  );
}

function DeviceRow({
  device,
  active,
  selected,
  onSelect,
  onToggle,
  onConnect,
}: {
  device: Device;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onConnect: () => void;
}) {
  const online = device.status === 'online';
  const env = environmentMeta[device.env];
  const cpuColor = resourceColor(device.cpu, 'cpu');
  const ramColor = resourceColor(device.ram, 'ram');

  return (
    <div
      className={`flex h-[38px] cursor-pointer items-center border-b border-ssh-toolbar px-3 hover:bg-ssh-control ${
        selected ? 'bg-ssh-selected' : active ? 'bg-[#0e1820]' : 'bg-transparent'
      }`}
      onClick={onSelect}
    >
      <div className="w-6 min-w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <input
          aria-label={`Select ${device.name}`}
          checked={selected}
          className="h-[11px] w-[11px] cursor-pointer accent-ssh-blue"
          readOnly
          type="checkbox"
        />
      </div>
      <div className="flex w-3 min-w-3 shrink-0 items-center justify-center">
        <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-ssh-green' : 'bg-ssh-muted-dark'}`} />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden pl-1">
        <span className="truncate whitespace-nowrap text-[13px] font-medium text-ssh-text">{device.name}</span>
        <span
          className="shrink-0 rounded-[1px] px-1.5 py-px text-[10px]"
          style={{ backgroundColor: env.background, color: env.color }}
        >
          {device.env}
        </span>
      </div>
      <div className="w-[88px] min-w-[88px] shrink-0 text-[12px] text-ssh-soft">{device.ip}</div>
      <ResourceCell color={cpuColor} label={online ? `${device.cpu}%` : '-'} value={online ? device.cpu : 0} />
      <ResourceCell color={ramColor} label={online ? `${device.ram}%` : '-'} value={online ? device.ram : 0} />
      <div className="flex w-14 min-w-14 shrink-0 justify-end">
        <button
          className={`rounded-[2px] border px-1.5 py-0.5 text-[11px] ${
            online
              ? 'border-ssh-green/25 bg-ssh-green/10 text-ssh-green hover:bg-ssh-green/20'
              : 'border-ssh-border bg-transparent text-ssh-dim'
          }`}
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
          disabled={!online}
        >
          ssh
        </button>
      </div>
    </div>
  );
}

function ResourceCell({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex w-[76px] min-w-[76px] shrink-0 items-center gap-1">
      <div className="h-[3px] w-[38px] shrink-0 overflow-hidden rounded-[1px] bg-ssh-border-soft">
        <div className="h-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="min-w-6 text-right text-[11px] text-ssh-muted">{label}</span>
    </div>
  );
}
