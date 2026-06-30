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
    <aside className="flex w-[188px] min-w-[188px] shrink-0 flex-col overflow-hidden border-r border-[#1e2124] bg-[#0b0d0e]">
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarRow active={activeGroup === "all"} count={devices.length} label="all devices" />
        <div className="mx-2 my-1.5 h-px bg-[#1a1d20]" />
        {environmentOrder.map((env) => {
          const meta = environmentMeta[env];
          const envDevices = devices.filter((device) => device.env === env);
          const onlineCount = envDevices.filter((device) => device.status === "online").length;

          return (
            <section key={env}>
              <div className="flex cursor-grab select-none items-center justify-between px-3 py-1.5 hover:bg-[#131618]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 text-[7px] text-[#3d4147]">v</span>
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[1px]"
                    style={{ color: meta.color }}
                  >
                    {env}
                  </span>
                </div>
                <span className="text-[9px] text-[#3d4147]">
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
      <div className="shrink-0 border-t border-[#1a1d20] px-3 py-2 text-[9px] text-[#2a2e33]">
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
      className={`flex cursor-pointer items-center justify-between py-1 hover:bg-[#131618] ${
        nested ? "pl-6 pr-3" : "px-3"
      } ${active ? "bg-[#1a1d20]" : ""}`}
    >
      <span className={`text-[10px] font-medium ${active ? "text-[#c9d1d9]" : "text-[#4a5568]"}`}>
        {label}
      </span>
      <span className="rounded-[2px] bg-[#131618] px-1.5 py-px text-[9px] text-[#3d4147]">
        {count}
      </span>
    </div>
  );
}
