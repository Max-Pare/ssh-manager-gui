'use client';

import { Device } from '@/app/_lib/ssh-manager-data';
import { DeviceDetailPanel } from './DeviceDetailPanel';
import { DeviceTable } from './DeviceTable';

type Props = {
  devices: Device[];
  activeDevice: Device | null;
  selectedIds: Set<number>;
  filterQ: string;
  onFilterQ: (q: string) => void;
  onSelectDevice: (id: number) => void;
  onToggleSelect: (id: number) => void;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onCloseDetail: () => void;
  onConnect: (device: Device) => void;
  onEdit: (device: Device) => void;
  onDelete: (id: number) => void;
  onPoll: (id: number) => void;
  onBulkDelete: (ids: number[]) => void;
  onBulkConnect: (ids: number[]) => void;
};

export function DeviceWorkspace({
  devices,
  activeDevice,
  selectedIds,
  filterQ,
  onFilterQ,
  onSelectDevice,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onCloseDetail,
  onConnect,
  onEdit,
  onDelete,
  onPoll,
  onBulkDelete,
  onBulkConnect,
}: Props) {
  const allSelected = devices.length > 0 && devices.every((d) => selectedIds.has(d.id));
  const someSelected = selectedIds.size > 0;

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Toolbar count={devices.length} filterQ={filterQ} onFilterQ={onFilterQ} />
      {someSelected && (
        <BulkBar
          selectedCount={selectedIds.size}
          onConnectAll={() => onBulkConnect([...selectedIds])}
          onRemoveAll={() => onBulkDelete([...selectedIds])}
          onClear={onClearSelection}
        />
      )}
      <ColumnHeader allSelected={allSelected} someSelected={someSelected} detailOpen={!!activeDevice} onSelectAll={onSelectAll} />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <DeviceTable
          rows={devices}
          activeDeviceId={activeDevice?.id ?? null}
          selectedIds={selectedIds}
          onSelectDevice={onSelectDevice}
          onToggleSelect={onToggleSelect}
          onConnect={onConnect}
        />
        {activeDevice && (
          <DeviceDetailPanel
            device={activeDevice}
            onConnect={onConnect}
            onEdit={onEdit}
            onDelete={onDelete}
            onPoll={onPoll}
            onClose={onCloseDetail}
          />
        )}
      </div>
    </main>
  );
}

function Toolbar({ count, filterQ, onFilterQ }: { count: number; filterQ: string; onFilterQ: (q: string) => void }) {
  return (
    <div className="ssh-section-border flex h-10 min-h-10 shrink-0 items-center gap-2 bg-ssh-toolbar px-3">
      <label className="flex max-w-80 flex-1 items-center gap-1.5 rounded-[2px] border border-ssh-border bg-ssh-bg px-2">
        <span className="text-[15px] leading-none text-ssh-muted-dark">/</span>
        <input
          className="w-full border-0 bg-transparent py-1.5 text-[12px] text-ssh-text outline-none placeholder:text-ssh-muted-dark"
          placeholder="filter hosts, IPs, tags..."
          type="text"
          value={filterQ}
          onChange={(e) => onFilterQ(e.target.value)}
        />
        {filterQ && (
          <button className="text-[12px] text-ssh-muted-dark hover:text-ssh-text" onClick={() => onFilterQ('')}>x</button>
        )}
      </label>
      <div className="flex-1" />
      <span className="ssh-text-xs-muted">{count} devices</span>
    </div>
  );
}

function BulkBar({
  selectedCount,
  onConnectAll,
  onRemoveAll,
  onClear,
}: {
  selectedCount: number;
  onConnectAll: () => void;
  onRemoveAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex h-[34px] min-h-[34px] shrink-0 items-center gap-2.5 border-b border-ssh-border-blue bg-ssh-selected px-3">
      <span className="text-[12px] text-ssh-yellow">{selectedCount} selected</span>
      <button className="ssh-button-success px-2 py-0.5 text-[11px]" onClick={onConnectAll}>connect all</button>
      <button
        className="ssh-button-danger px-2 py-0.5"
        onClick={() => { if (confirm(`Delete ${selectedCount} devices?`)) onRemoveAll(); }}
      >
        remove
      </button>
      <div className="flex-1" />
      <button className="text-[11px] text-ssh-muted hover:text-ssh-text" onClick={onClear}>x clear</button>
    </div>
  );
}

function ColumnHeader({
  allSelected,
  someSelected,
  detailOpen,
  onSelectAll,
}: {
  allSelected: boolean;
  someSelected: boolean;
  detailOpen: boolean;
  onSelectAll: (checked: boolean) => void;
}) {
  return (
    <div className={`ssh-section-border flex h-[26px] min-h-[26px] shrink-0 items-center bg-ssh-sidebar pl-3 ${detailOpen ? 'pr-[300px]' : 'pr-3'}`}>
      <div className="w-6 min-w-6 shrink-0">
        <input
          aria-label="Select all devices"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
          className="h-[11px] w-[11px] cursor-pointer accent-[#58a6ff]"
          type="checkbox"
          onChange={(e) => onSelectAll(e.target.checked)}
        />
      </div>
      <div className="w-3 min-w-3 shrink-0" />
      <ColumnLabel className="flex-1 pl-1">host</ColumnLabel>
      <ColumnLabel className="w-[124px] min-w-[124px]">ip address</ColumnLabel>
      <ColumnLabel className="w-[76px] min-w-[76px]">cpu</ColumnLabel>
      <ColumnLabel className="w-[76px] min-w-[76px]">ram</ColumnLabel>
      <div className="w-14 min-w-14 shrink-0" />
    </div>
  );
}

function ColumnLabel({ children, className }: { children: React.ReactNode; className: string }) {
  return <div className={`ssh-column-label ${className}`}>{children}</div>;
}
