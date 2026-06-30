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
    <div className="flex h-10 min-h-10 shrink-0 items-center gap-2 border-b border-[#1e2124] bg-[#0f1113] px-3">
      <label className="flex max-w-80 flex-1 items-center gap-1.5 rounded-[2px] border border-[#1e2124] bg-[#0d0f10] px-2">
        <span className="text-[13px] leading-none text-[#3d4147]">/</span>
        <input
          className="w-full border-0 bg-transparent py-1.5 text-[10px] text-[#c9d1d9] outline-none placeholder:text-[#3d4147]"
          placeholder="filter hosts, IPs, tags..."
          readOnly
          type="text"
        />
      </label>
      <div className="flex-1" />
      <span className="text-[9px] text-[#3d4147]">{count} devices</span>
    </div>
  );
}

function BulkBar({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="flex h-[34px] min-h-[34px] shrink-0 items-center gap-2.5 border-b border-[#2a3040] bg-[#161b22] px-3">
      <span className="text-[10px] text-[#e3b341]">{selectedCount} selected</span>
      <button className="rounded-[2px] border border-[rgba(63,185,80,.2)] bg-[rgba(63,185,80,.08)] px-2 py-0.5 text-[9px] text-[#3fb950]">
        connect all
      </button>
      <button className="rounded-[2px] border border-[rgba(248,81,73,.2)] bg-[rgba(248,81,73,.06)] px-2 py-0.5 text-[9px] text-[#f85149]">
        remove
      </button>
      <div className="flex-1" />
      <button className="text-[9px] text-[#4a5568]">x clear</button>
    </div>
  );
}

function ColumnHeader() {
  return (
    <div className="flex h-[26px] min-h-[26px] shrink-0 items-center border-b border-[#1e2124] bg-[#0b0d0e] px-3">
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
    <div className={`shrink-0 text-[8px] uppercase tracking-[.5px] text-[#3d4147] ${className}`}>
      {children}
    </div>
  );
}
