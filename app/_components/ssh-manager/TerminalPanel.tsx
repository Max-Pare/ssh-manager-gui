import { terminalLines } from "@/app/_lib/ssh-manager-data";

export function TerminalPanel() {
  return (
    <section className="z-20 flex h-[260px] shrink-0 flex-col overflow-hidden border-t border-ssh-border bg-ssh-terminal">
      <div className="ssh-divider-soft h-1 min-h-1 shrink-0" />
      <div className="flex h-8 min-h-8 shrink-0 items-center overflow-hidden border-b border-ssh-border-soft bg-ssh-bg px-3">
        <span className="shrink-0 pr-3 text-[9px] uppercase tracking-[1px] text-ssh-muted-dark">
          terminal
        </span>
        <TerminalTab active label="prod-api-01" statusColor="#3fb950" />
        <TerminalTab label="prod-db-01" statusColor="#e3b341" />
        <div className="flex-1" />
        <span className="shrink-0 pr-2.5 text-[9px] text-ssh-dim">ctrl+`</span>
        <button className="shrink-0 rounded-[2px] border border-ssh-border-soft px-2 py-0.5 text-[10px] text-ssh-muted">
          v
        </button>
      </div>
      <div className="min-h-0 flex-1 cursor-text overflow-y-auto px-3.5 py-2">
        {terminalLines.map((line, index) => (
          <div key={`${line.text}-${index}`} className="whitespace-pre-wrap break-all text-xs leading-[1.55]">
            {line.prompt ? <span className="text-ssh-green">{line.prompt}</span> : null}
            <span style={{ color: line.color }}>{line.text}</span>
          </div>
        ))}
        <div className="flex items-baseline pb-1.5">
          <span className="shrink-0 whitespace-pre text-xs text-ssh-green">ubuntu@prod-api-01:~$ </span>
          <span className="h-3 w-1 bg-ssh-green" />
        </div>
      </div>
    </section>
  );
}

function TerminalTab({
  active = false,
  label,
  statusColor,
}: {
  active?: boolean;
  label: string;
  statusColor: string;
}) {
  return (
    <div
      className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 border-r border-ssh-border-soft px-2.5 ${
        active ? "bg-ssh-active" : "bg-transparent"
      }`}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: statusColor }} />
      <span className={`whitespace-nowrap text-[10px] ${active ? "text-ssh-text" : "text-ssh-muted"}`}>
        {label}
      </span>
      <span className="ml-0.5 px-0.5 text-[10px] text-ssh-muted-dark">x</span>
    </div>
  );
}
