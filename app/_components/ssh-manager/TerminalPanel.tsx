'use client';

import { Terminal, TerminalStatus } from './Terminal';

export type TerminalSession = {
  id: string;
  deviceId: number;
  deviceName: string;
  status: TerminalStatus;
  ws: WebSocket | null;
};

type Props = {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onStatusChange: (sessionId: string, status: TerminalStatus) => void;
  onToggleVisible?: () => void;
};

export function TerminalPanel({ sessions, activeSessionId, onSelectSession, onCloseSession, onStatusChange, onToggleVisible }: Props) {
  return (
    <section className="z-20 flex h-[260px] shrink-0 flex-col overflow-hidden border-t border-ssh-border bg-ssh-terminal">
      <div className="ssh-divider-soft h-1 min-h-1 shrink-0" />
      <div className="flex h-8 min-h-8 shrink-0 items-center overflow-hidden border-b border-ssh-border-soft bg-ssh-bg px-3">
        <span className="shrink-0 pr-3 text-[11px] uppercase tracking-[1px] text-ssh-muted-dark">terminal</span>
        {sessions.map((session) => (
          <TerminalTab
            key={session.id}
            active={session.id === activeSessionId}
            label={session.deviceName}
            status={session.status}
            onSelect={() => onSelectSession(session.id)}
            onClose={(e) => { e.stopPropagation(); onCloseSession(session.id); }}
          />
        ))}
        <div className="flex-1" />
        <span className="shrink-0 pr-2.5 text-[11px] text-ssh-dim">ctrl+`</span>
        <button
          className="shrink-0 rounded-[2px] border border-ssh-border-soft px-2 py-0.5 text-[12px] text-ssh-muted hover:text-ssh-text"
          onClick={onToggleVisible}
          title="minimize"
        >
          v
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        {sessions.map((session) => (
          <Terminal
            key={session.id}
            sessionId={session.id}
            ws={session.ws}
            active={session.id === activeSessionId}
            onStatusChange={onStatusChange}
          />
        ))}
        {sessions.length === 0 && (
          <div className="flex h-full items-center justify-center text-[13px] text-ssh-dim">
            no active sessions — connect to a device to open a terminal
          </div>
        )}
      </div>
    </section>
  );
}

function TerminalTab({
  active,
  label,
  status,
  onSelect,
  onClose,
}: {
  active: boolean;
  label: string;
  status: TerminalStatus;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  const statusColor =
    status === 'connected' ? '#3fb950' :
    status === 'connecting' ? '#e3b341' :
    status === 'error' ? '#f85149' : '#6e7681';

  return (
    <div
      className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 border-r border-ssh-border-soft px-2.5 ${
        active ? 'bg-ssh-active' : 'bg-transparent hover:bg-ssh-control'
      }`}
      onClick={onSelect}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: statusColor }} />
      <span className={`whitespace-nowrap text-[12px] ${active ? 'text-ssh-text' : 'text-ssh-muted'}`}>{label}</span>
      <button
        className="ml-0.5 px-0.5 text-[12px] text-ssh-muted-dark hover:text-ssh-text"
        onClick={onClose}
      >
        x
      </button>
    </div>
  );
}
