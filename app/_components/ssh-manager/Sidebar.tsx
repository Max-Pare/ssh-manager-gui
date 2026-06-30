'use client';

import { Device, EnvironmentId, EnvironmentMeta, environmentMeta, groupsForEnvironment } from '@/app/_lib/ssh-manager-data';

type Props = {
  devices: Device[];
  envOrder: EnvironmentId[];
  activeEnv: EnvironmentId | 'all';
  activeGroup: string | null;
  onSelectAll: () => void;
  onSelectEnv: (env: EnvironmentId) => void;
  onSelectGroup: (env: EnvironmentId, group: string) => void;
};

export function Sidebar({ devices, envOrder, activeEnv, activeGroup, onSelectAll, onSelectEnv, onSelectGroup }: Props) {
  return (
    <aside className="flex w-[188px] min-w-[188px] shrink-0 flex-col overflow-hidden border-r border-ssh-border bg-ssh-sidebar">
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarRow
          active={activeEnv === 'all' && !activeGroup}
          count={devices.length}
          label="all devices"
          onClick={onSelectAll}
        />
        <div className="ssh-divider-soft mx-2 my-1.5 h-px" />
        {envOrder.map((env) => {
          const meta: EnvironmentMeta = environmentMeta[env];
          const envDevices = devices.filter((d) => d.env === env);
          const onlineCount = envDevices.filter((d) => d.status === 'online').length;
          const groups = groupsForEnvironment(devices, env);

          return (
            <section key={env}>
              <div
                className="flex cursor-pointer select-none items-center justify-between px-3 py-1.5 hover:bg-ssh-control"
                onClick={() => onSelectEnv(env)}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 text-[9px] text-ssh-muted-dark">v</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[1px]" style={{ color: meta.color }}>
                    {env}
                  </span>
                </div>
                <span className="ssh-text-xs-muted">{onlineCount}/{envDevices.length}</span>
              </div>
              {groups.map((group) => (
                <SidebarRow
                  key={`${env}-${group.id}`}
                  active={activeEnv === env && activeGroup === group.id}
                  count={group.count}
                  onlineCount={group.onlineCount}
                  label={group.label}
                  nested
                  onClick={() => onSelectGroup(env, group.id)}
                />
              ))}
            </section>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-ssh-border-soft px-3 py-2 text-[11px] text-ssh-dim">
        ctrl+` terminal
      </div>
    </aside>
  );
}

function SidebarRow({
  active,
  count,
  onlineCount,
  label,
  nested = false,
  onClick,
}: {
  active: boolean;
  count: number;
  onlineCount?: number;
  label: string;
  nested?: boolean;
  onClick: () => void;
}) {
  const countLabel = onlineCount !== undefined ? `${onlineCount}/${count}` : String(count);
  return (
    <div
      className={`flex cursor-pointer items-center justify-between py-1 hover:bg-ssh-control ${
        nested ? 'pl-6 pr-3' : 'px-3'
      } ${active ? 'bg-ssh-active' : ''}`}
      onClick={onClick}
    >
      <span className={`text-[12px] font-medium ${active ? 'text-ssh-text' : 'text-ssh-muted'}`}>{label}</span>
      <span className="ssh-count-pill">{countLabel}</span>
    </div>
  );
}
