import { Device } from "@/app/_lib/ssh-manager-data";
import { DeviceDetailPanel } from "./DeviceDetailPanel";
import { DeviceTable } from "./DeviceTable";

type DeviceWorkspaceProps = {
  activeDevice: Device;
  rows: Device[];
};

export function DeviceWorkspace({ activeDevice, rows }: DeviceWorkspaceProps) {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Toolbar count={rows.length} />
      <BulkBar selectedCount={2} />
      <ColumnHeader />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <DeviceTable rows={rows} />
        <DeviceDetailPanel device={activeDevice} />
      </div>
    </main>
  );
}

function Toolbar({ count }: { count: number }) {
  return (
    <div className="ssh-section-border flex h-10 min-h-10 shrink-0 items-center gap-2 bg-ssh-toolbar px-3">
      <label className="flex max-w-80 flex-1 items-center gap-1.5 rounded-[2px] border border-ssh-border bg-ssh-bg px-2">
        <span className="text-[13px] leading-none text-ssh-muted-dark">/</span>
        <input
          className="w-full border-0 bg-transparent py-1.5 text-[10px] text-ssh-text outline-none placeholder:text-ssh-muted-dark"
          placeholder="filter hosts, IPs, tags..."
          readOnly
          type="text"
        />
      </label>
      <div className="flex-1" />
      <span className="ssh-text-xs-muted">{count} devices</span>
    </div>
  );
}

function BulkBar({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="flex h-[34px] min-h-[34px] shrink-0 items-center gap-2.5 border-b border-ssh-border-blue bg-ssh-selected px-3">
      <span className="text-[10px] text-ssh-yellow">{selectedCount} selected</span>
      <button className="ssh-button-success px-2 py-0.5 text-[9px]">
        connect all
      </button>
      <button className="ssh-button-danger px-2 py-0.5">
        remove
      </button>
      <div className="flex-1" />
      <button className="text-[9px] text-ssh-muted">x clear</button>
    </div>
  );
}

function ColumnHeader() {
  return (
    <div className="ssh-section-border flex h-[26px] min-h-[26px] shrink-0 items-center bg-ssh-sidebar px-3">
      <div className="w-6 min-w-6 shrink-0">
        <input
          aria-label="Select all devices"
          checked
          className="h-[11px] w-[11px] cursor-pointer accent-[#58a6ff]"
          readOnly
          type="checkbox"
        />
      </div>
      <div className="w-3 min-w-3 shrink-0" />
      <ColumnLabel className="flex-1 pl-1">host</ColumnLabel>
      <ColumnLabel className="w-[88px] min-w-[88px]">ip address</ColumnLabel>
      <ColumnLabel className="w-[76px] min-w-[76px]">cpu</ColumnLabel>
      <ColumnLabel className="w-[76px] min-w-[76px]">ram</ColumnLabel>
      <div className="w-14 min-w-14 shrink-0" />
    </div>
  );
}

function ColumnLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div className={`ssh-column-label ${className}`}>
      {children}
    </div>
  );
}
