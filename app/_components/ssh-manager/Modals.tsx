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
      <p className="mb-2.5 text-[10px] text-ssh-muted">
        paste your <span className="text-ssh-green">~/.ssh/config</span> below
      </p>
      <textarea
        className="ssh-input h-44 resize-y p-2.5 leading-relaxed"
        defaultValue={"Host my-server\n  HostName 192.168.1.10\n  User ubuntu\n  Port 22"}
      />
    </ModalFrame>
  );
}

export function ExportModalPreview() {
  return (
    <ModalFrame title="export as ssh config">
      <p className="mb-2.5 text-[10px] text-ssh-muted">
        copy to <span className="text-ssh-green">~/.ssh/config</span>
      </p>
      <textarea
        className="ssh-input h-48 resize-none p-2.5 leading-relaxed text-ssh-soft"
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
    <section className="w-full max-w-[520px] rounded-[3px] border border-ssh-border bg-ssh-header">
      <header className="ssh-section-border flex items-center justify-between px-5 py-3.5">
        <h2 className="text-xs font-semibold text-ssh-heading">{title}</h2>
        <button className="text-[15px] text-ssh-muted-dark">x</button>
      </header>
      <div className="flex flex-col gap-3.5 p-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="ssh-label">
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
        className="ssh-input"
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
        active ? "border-ssh-border-blue bg-ssh-active text-ssh-text" : "border-ssh-border text-ssh-muted"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-ssh-green" : "border border-ssh-muted-dark"}`} />
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
    <div className="flex items-center justify-between border-b border-ssh-border-soft pb-3">
      <div>
        <div className="mb-0.5 text-[11px] text-ssh-text">{label}</div>
        <div className="text-[9px] text-ssh-muted-dark">{helper}</div>
      </div>
      {value ? (
        <input
          className="w-12 rounded-[2px] border border-ssh-border bg-ssh-bg px-2 py-1 text-center text-[11px] text-ssh-text"
          defaultValue={value}
        />
      ) : (
        <div
          className={`relative h-[18px] w-8 rounded-full ${enabled ? "bg-ssh-green" : "border border-ssh-border bg-ssh-active"}`}
        >
          <div
            className={`absolute top-0.5 h-3.5 w-3.5 rounded-full ${enabled ? "right-0.5 bg-white" : "left-0.5 bg-ssh-muted-dark"}`}
          />
        </div>
      )}
    </div>
  );
}
