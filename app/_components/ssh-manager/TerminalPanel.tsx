import { terminalLines } from "@/app/_lib/ssh-manager-data";

export function TerminalPanel() {
  return (
    <section className="z-20 flex h-[260px] shrink-0 flex-col overflow-hidden border-t border-[#1e2124] bg-[#0a0c0e]">
      <div className="h-1 min-h-1 shrink-0 bg-[#1a1d20]" />
      <div className="flex h-8 min-h-8 shrink-0 items-center overflow-hidden border-b border-[#1a1d20] bg-[#0d0f10] px-3">
        <span className="shrink-0 pr-3 text-[9px] uppercase tracking-[1px] text-[#3d4147]">
          terminal
        </span>
        <TerminalTab active label="prod-api-01" statusColor="#3fb950" />
        <TerminalTab label="prod-db-01" statusColor="#e3b341" />
        <div className="flex-1" />
        <span className="shrink-0 pr-2.5 text-[9px] text-[#2a2e33]">ctrl+`</span>
        <button className="shrink-0 rounded-[2px] border border-[#1a1d20] px-2 py-0.5 text-[10px] text-[#4a5568]">
          v
        </button>
      </div>
      <div className="min-h-0 flex-1 cursor-text overflow-y-auto px-3.5 py-2">
        {terminalLines.map((line, index) => (
          <div key={`${line.text}-${index}`} className="whitespace-pre-wrap break-all text-xs leading-[1.55]">
            {line.prompt ? <span className="text-[#3fb950]">{line.prompt}</span> : null}
            <span style={{ color: line.color }}>{line.text}</span>
          </div>
        ))}
        <div className="flex items-baseline pb-1.5">
          <span className="shrink-0 whitespace-pre text-xs text-[#3fb950]">ubuntu@prod-api-01:~$ </span>
          <span className="h-3 w-1 bg-[#3fb950]" />
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
      className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 border-r border-[#1a1d20] px-2.5 ${
        active ? "bg-[#1a1d20]" : "bg-transparent"
      }`}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: statusColor }} />
      <span className={`whitespace-nowrap text-[10px] ${active ? "text-[#c9d1d9]" : "text-[#4a5568]"}`}>
        {label}
      </span>
      <span className="ml-0.5 px-0.5 text-[10px] text-[#3d4147]">x</span>
    </div>
  );
}
