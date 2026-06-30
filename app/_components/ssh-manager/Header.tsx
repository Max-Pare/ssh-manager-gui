'use client';

type HeaderProps = {
  totalOnline: number;
  totalOffline: number;
  onImport: () => void;
  onExport: () => void;
  onNewDevice: () => void;
  onSettings: () => void;
};

export function Header({ totalOnline, totalOffline, onImport, onExport, onNewDevice, onSettings }: HeaderProps) {
  return (
    <header className="ssh-section-border flex h-11 shrink-0 items-center gap-3 bg-ssh-header px-4 text-ssh-text">
      <div className="flex items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-ssh-green text-[10px] font-semibold text-ssh-green">
          $_
        </div>
        <span className="text-[15px] font-semibold tracking-[-.03em] text-ssh-heading">
          ssh-mgr
        </span>
      </div>
      <div className="ssh-divider h-[18px] w-px" />
      <StatusMetric label={`${totalOnline} online`} tone="online" />
      <StatusMetric label={`${totalOffline} offline`} tone="offline" />
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <HeaderButton onClick={onImport}>import</HeaderButton>
        <HeaderButton onClick={onExport}>export</HeaderButton>
        <div className="ssh-divider mx-1 h-3.5 w-px" />
        <button className="ssh-button-success px-2.5 py-1" onClick={onNewDevice}>
          + new device
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-ssh-border bg-ssh-control text-[15px] text-ssh-soft"
          onClick={onSettings}
          title="settings"
        >
          *
        </button>
      </div>
    </header>
  );
}

function StatusMetric({ label, tone }: { label: string; tone: 'online' | 'offline' }) {
  const cls = tone === 'online' ? 'text-ssh-green' : 'text-ssh-muted-dark';
  return (
    <span className={`flex items-center gap-1 text-[12px] ${cls}`}>
      <span className={`h-[5px] w-[5px] rounded-full ${tone === 'online' ? 'bg-ssh-green' : 'bg-ssh-muted-dark'}`} />
      {label}
    </span>
  );
}

function HeaderButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="ssh-button bg-transparent text-[11px] transition-colors hover:border-ssh-green hover:text-ssh-text"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
