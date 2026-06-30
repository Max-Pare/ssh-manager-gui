import { Device, environmentMeta, resourceColor } from "@/app/_lib/ssh-manager-data";

type DeviceDetailPanelProps = {
  device: Device;
};

export function DeviceDetailPanel({ device }: DeviceDetailPanelProps) {
  const online = device.status === "online";
  const env = environmentMeta[device.env];

  return (
    <aside className="absolute bottom-0 right-0 top-0 z-10 w-[284px] overflow-y-auto border-l border-[#1e2124] bg-[#0b0d0e]">
      <section className="border-b border-[#1e2124] px-4 py-3.5">
        <div className="mb-1.5 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: online ? "#3fb950" : "#f85149" }}
              />
              <h2 className="text-[13px] font-semibold text-[#e2e8f0]">{device.name}</h2>
            </div>
            <p className="max-w-[228px] truncate pl-3 text-[9px] text-[#4a5568]">
              {device.user}@{device.hostname}
            </p>
          </div>
          <button className="text-sm text-[#3d4147]">x</button>
        </div>
        <div className="flex gap-1.5 pl-3">
          <Badge
            background={online ? "rgba(63,185,80,.08)" : "rgba(248,81,73,.08)"}
            color={online ? "#3fb950" : "#f85149"}
          >
            {device.status}
          </Badge>
          <Badge background={env.background} color={env.color}>
            {env.label}
          </Badge>
        </div>
      </section>

      <section className="flex gap-1.5 border-b border-[#1e2124] px-4 py-2.5">
        <button className="flex-1 rounded-[2px] border border-[rgba(63,185,80,.22)] bg-[rgba(63,185,80,.1)] py-1.5 text-[10px] text-[#3fb950]">
          connect
        </button>
        <button className="rounded-[2px] border border-[#1e2124] bg-[#131618] px-2.5 py-1.5 text-[10px] text-[#7d8590]">
          edit
        </button>
        <button className="rounded-[2px] border border-[#1e2124] bg-[#131618] px-2.5 py-1.5 text-[10px] text-[#7d8590]">
          ...
        </button>
      </section>

      <DetailSection title="resources">
        <ResourceDetail label="cpu" value={online ? device.cpu : 0} valueLabel={online ? `${device.cpu}%` : "N/A"} kind="cpu" />
        <ResourceDetail label="ram" value={online ? device.ram : 0} valueLabel={online ? `${device.ram}%` : "N/A"} kind="ram" />
        <KeyValue label="uptime" value={device.uptime} />
      </DetailSection>

      <DetailSection title="connection">
        <KeyValue label="host" value={device.hostname} />
        <KeyValue label="ip" value={device.ip} />
        <KeyValue label="port" value={device.port.toString()} />
        <KeyValue label="user" value={device.user} />
        <KeyValue label="auth" value={device.authType === "key" ? "SSH key" : "password"} />
        <KeyValue label="os" value={device.os} />
      </DetailSection>

      <section className="px-4 py-3">
        <SectionTitle>tags</SectionTitle>
        <div className="flex flex-wrap gap-1">
          {device.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[2px] border border-[#1e2124] bg-[#131618] px-1.5 py-0.5 text-[9px] text-[#7d8590]"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2.5 text-[9px] text-[#3d4147]">last seen {device.lastSeen}</p>
      </section>
    </aside>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="border-b border-[#1e2124] px-4 py-3">
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[8px] uppercase tracking-[1.5px] text-[#3d4147]">{children}</div>
  );
}

function ResourceDetail({
  kind,
  label,
  value,
  valueLabel,
}: {
  kind: "cpu" | "ram";
  label: string;
  value: number;
  valueLabel: string;
}) {
  const color = resourceColor(value, kind);

  return (
    <div className="mb-1.5">
      <div className="mb-1 flex justify-between">
        <span className="text-[10px] text-[#7d8590]">{label}</span>
        <span className="text-[10px]" style={{ color }}>
          {valueLabel}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-sm bg-[#1a1d20]">
        <div className="h-full rounded-sm" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="shrink-0 text-[9px] text-[#3d4147]">{label}</span>
      <span className="truncate text-right text-[9px] text-[#4a5568]">{value}</span>
    </div>
  );
}

function Badge({
  background,
  children,
  color,
}: {
  background: string;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span className="rounded-[2px] px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: background, color }}>
      {children}
    </span>
  );
}
