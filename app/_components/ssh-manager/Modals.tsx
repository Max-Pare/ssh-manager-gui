import { deviceExportText } from "@/app/_lib/ssh-manager-data";

export function AddDeviceModalPreview() {
  return (
    <ModalFrame title="new connection">
      <Field label="name" placeholder="e.g. web-03" />
      <div className="flex gap-2.5">
        <Field className="flex-1" label="hostname / ip" placeholder="192.168.1.x" />
        <Field className="w-[72px]" label="port" placeholder="22" />
      </div>
      <Field label="username" placeholder="ubuntu" />
      <div>
        <Label>auth method</Label>
        <div className="flex gap-1">
          <Choice active label="ssh key" />
          <Choice label="password" />
        </div>
      </div>
    </ModalFrame>
  );
}

export function SettingsModalPreview() {
  return (
    <ModalFrame title="settings">
      <SettingRow enabled helper="reconnect dropped sessions" label="auto-reconnect" />
      <SettingRow helper="seconds before unreachable" label="connection timeout" value="30" />
      <SettingRow helper="keepalive ping every N seconds" label="ServerAliveInterval" value="60" />
    </ModalFrame>
  );
}

export function ImportModalPreview() {
  return (
    <ModalFrame title="import ~/.ssh/config">
      <p className="mb-2.5 text-[10px] text-[#4a5568]">
        paste your <span className="text-[#3fb950]">~/.ssh/config</span> below
      </p>
      <textarea
        className="h-44 w-full resize-y rounded-[2px] border border-[#1e2124] bg-[#0d0f10] p-2.5 text-[11px] leading-relaxed text-[#c9d1d9]"
        defaultValue={"Host my-server\n  HostName 192.168.1.10\n  User ubuntu\n  Port 22"}
      />
    </ModalFrame>
  );
}

export function ExportModalPreview() {
  return (
    <ModalFrame title="export as ssh config">
      <p className="mb-2.5 text-[10px] text-[#4a5568]">
        copy to <span className="text-[#3fb950]">~/.ssh/config</span>
      </p>
      <textarea
        className="h-48 w-full resize-none rounded-[2px] border border-[#1e2124] bg-[#0d0f10] p-2.5 text-[11px] leading-relaxed text-[#7d8590]"
        defaultValue={deviceExportText()}
      />
    </ModalFrame>
  );
}

function ModalFrame({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="w-full max-w-[520px] rounded-[3px] border border-[#1e2124] bg-[#111315]">
      <header className="flex items-center justify-between border-b border-[#1e2124] px-5 py-3.5">
        <h2 className="text-xs font-semibold text-[#e2e8f0]">{title}</h2>
        <button className="text-[15px] text-[#3d4147]">x</button>
      </header>
      <div className="flex flex-col gap-3.5 p-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[9px] uppercase tracking-[1px] text-[#3d4147]">
      {children}
    </label>
  );
}

function Field({
  className = "",
  label,
  placeholder,
}: {
  className?: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <input
        className="w-full rounded-[2px] border border-[#1e2124] bg-[#0d0f10] px-2.5 py-2 text-[11px] text-[#c9d1d9] placeholder:text-[#3d4147]"
        placeholder={placeholder}
        readOnly
      />
    </div>
  );
}

function Choice({ active = false, label }: { active?: boolean; label: string }) {
  return (
    <div
      className={`flex flex-1 items-center gap-2 rounded-[2px] border px-3 py-2 ${
        active ? "border-[#2a3040] bg-[#1a1d20] text-[#c9d1d9]" : "border-[#1e2124] text-[#4a5568]"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-[#3fb950]" : "border border-[#3d4147]"}`} />
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

function SettingRow({
  enabled = false,
  helper,
  label,
  value,
}: {
  enabled?: boolean;
  helper: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#1a1d20] pb-3">
      <div>
        <div className="mb-0.5 text-[11px] text-[#c9d1d9]">{label}</div>
        <div className="text-[9px] text-[#3d4147]">{helper}</div>
      </div>
      {value ? (
        <input
          className="w-12 rounded-[2px] border border-[#1e2124] bg-[#0d0f10] px-2 py-1 text-center text-[11px] text-[#c9d1d9]"
          defaultValue={value}
        />
      ) : (
        <div
          className={`relative h-[18px] w-8 rounded-full ${enabled ? "bg-[#3fb950]" : "border border-[#1e2124] bg-[#1a1d20]"}`}
        >
          <div
            className={`absolute top-0.5 h-3.5 w-3.5 rounded-full ${enabled ? "right-0.5 bg-white" : "left-0.5 bg-[#3d4147]"}`}
          />
        </div>
      )}
    </div>
  );
}
