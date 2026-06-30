import {
  devices,
  environmentMeta,
  environmentOrder,
  groupsForEnvironment,
} from "@/app/_lib/ssh-manager-data";

type SidebarProps = {
  activeGroup: string;
};

export function Sidebar({ activeGroup }: SidebarProps) {
  return (
    <aside className="flex w-[188px] min-w-[188px] shrink-0 flex-col overflow-hidden border-r border-ssh-border bg-ssh-sidebar">
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarRow active={activeGroup === "all"} count={devices.length} label="all devices" />
        <div className="ssh-divider-soft mx-2 my-1.5 h-px" />
        {environmentOrder.map((env) => {
          const meta = environmentMeta[env];
          const envDevices = devices.filter((device) => device.env === env);
          const onlineCount = envDevices.filter((device) => device.status === "online").length;

          return (
            <section key={env}>
              <div className="flex cursor-grab select-none items-center justify-between px-3 py-1.5 hover:bg-ssh-control">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 text-[7px] text-ssh-muted-dark">v</span>
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[1px]"
                    style={{ color: meta.color }}
                  >
                    {env}
                  </span>
                </div>
                <span className="ssh-text-xs-muted">
                  {onlineCount}/{envDevices.length}
                </span>
              </div>
              {groupsForEnvironment(env).map((group) => (
                <SidebarRow
                  key={`${env}-${group.id}`}
                  active={activeGroup === group.id}
                  count={group.count}
                  label={group.label}
                  nested
                />
              ))}
            </section>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-ssh-border-soft px-3 py-2 text-[9px] text-ssh-dim">
        drag envs to reorder - ctrl+` terminal
      </div>
    </aside>
  );
}

function SidebarRow({
  active,
  count,
  label,
  nested = false,
}: {
  active: boolean;
  count: number;
  label: string;
  nested?: boolean;
}) {
  return (
    <div
      className={`flex cursor-pointer items-center justify-between py-1 hover:bg-ssh-control ${
        nested ? "pl-6 pr-3" : "px-3"
      } ${active ? "bg-ssh-active" : ""}`}
    >
      <span className={`text-[10px] font-medium ${active ? "text-ssh-text" : "text-ssh-muted"}`}>
        {label}
      </span>
      <span className="ssh-count-pill">
        {count}
      </span>
    </div>
  );
}
