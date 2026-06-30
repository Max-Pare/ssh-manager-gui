type HeaderProps = {
  totalOnline: number;
  totalOffline: number;
};

export function Header({ totalOnline, totalOffline }: HeaderProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[#1e2124] bg-[#111315] px-4 text-[#c9d1d9]">
      <div className="flex items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#3fb950] text-[8px] font-semibold text-[#3fb950]">
          $_
        </div>
        <span className="text-[13px] font-semibold tracking-[-.03em] text-[#e2e8f0]">
          ssh-mgr
        </span>
      </div>
      <div className="h-[18px] w-px bg-[#1e2124]" />
      <StatusMetric color="#3fb950" label={`${totalOnline} online`} />
      <StatusMetric color="#3d4147" label={`${totalOffline} offline`} muted />
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <HeaderButton>import</HeaderButton>
        <HeaderButton>export</HeaderButton>
        <div className="mx-1 h-3.5 w-px bg-[#1e2124]" />
        <button className="rounded-[2px] border border-[rgba(63,185,80,.22)] bg-[rgba(63,185,80,.1)] px-2.5 py-1 text-[10px] text-[#3fb950]">
          + new device
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#1e2124] bg-[#131618] text-[13px] text-[#7d8590]">
          *
        </button>
      </div>
    </header>
  );
}

function StatusMetric({
  color,
  label,
  muted = false,
}: {
  color: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <span className={`flex items-center gap-1 text-[10px] ${muted ? "text-[#4a5568]" : ""}`} style={{ color }}>
      <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function HeaderButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-[2px] border border-[#1e2124] bg-transparent px-2.5 py-1 text-[9px] text-[#7d8590] transition-colors hover:border-[#3fb950] hover:text-[#c9d1d9]">
      {children}
    </button>
  );
}
