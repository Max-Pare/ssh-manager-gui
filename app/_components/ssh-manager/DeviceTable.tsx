import {
  Device,
  activeDeviceId,
  environmentMeta,
  resourceColor,
  selectedDeviceIds,
} from "@/app/_lib/ssh-manager-data";

type DeviceTableProps = {
  rows: Device[];
};

export function DeviceTable({ rows }: DeviceTableProps) {
  return (
    <section className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pr-[288px]">
        {rows.map((device) => (
          <DeviceRow key={device.id} device={device} />
        ))}
      </div>
    </section>
  );
}

function DeviceRow({ device }: { device: Device }) {
  const selected = selectedDeviceIds.includes(device.id);
  const active = device.id === activeDeviceId;
  const env = environmentMeta[device.env];
  const online = device.status === "online";
  const cpuColor = resourceColor(device.cpu, "cpu");
  const ramColor = resourceColor(device.ram, "ram");

  return (
    <div
      className={`flex h-[38px] cursor-pointer items-center border-b border-[#0f1113] px-3 hover:bg-[#131618] ${
        selected ? "bg-[#161b22]" : active ? "bg-[#0e1820]" : "bg-transparent"
      }`}
    >
      <div className="w-6 min-w-6 shrink-0">
        <input
          aria-label={`Select ${device.name}`}
          checked={selected}
          className="h-[11px] w-[11px] cursor-pointer accent-[#58a6ff]"
          readOnly
          type="checkbox"
        />
      </div>
      <div className="flex w-3 min-w-3 shrink-0 items-center justify-center">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: online ? "#3fb950" : "#3d4147" }}
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden pl-1">
        <span className="truncate whitespace-nowrap text-[11px] font-medium text-[#c9d1d9]">
          {device.name}
        </span>
        <span
          className="shrink-0 rounded-[1px] px-1.5 py-px text-[8px]"
          style={{ backgroundColor: env.background, color: env.color }}
        >
          {device.env}
        </span>
      </div>
      <div className="w-[88px] min-w-[88px] shrink-0 text-[10px] text-[#7d8590]">{device.ip}</div>
      <ResourceCell color={cpuColor} label={online ? `${device.cpu}%` : "-"} value={online ? device.cpu : 0} />
      <ResourceCell color={ramColor} label={online ? `${device.ram}%` : "-"} value={online ? device.ram : 0} />
      <div className="flex w-14 min-w-14 shrink-0 justify-end">
        <button
          className="rounded-[2px] border px-1.5 py-0.5 text-[9px]"
          style={{
            backgroundColor: online ? "rgba(63,185,80,.08)" : "transparent",
            borderColor: online ? "rgba(63,185,80,.25)" : "#1e2124",
            color: online ? "#3fb950" : "#2a2e33",
          }}
        >
          ssh
        </button>
      </div>
    </div>
  );
}

function ResourceCell({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex w-[76px] min-w-[76px] shrink-0 items-center gap-1">
      <div className="h-[3px] w-[38px] shrink-0 overflow-hidden rounded-[1px] bg-[#1a1d20]">
        <div className="h-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="min-w-6 text-right text-[9px] text-[#4a5568]">{label}</span>
    </div>
  );
}
