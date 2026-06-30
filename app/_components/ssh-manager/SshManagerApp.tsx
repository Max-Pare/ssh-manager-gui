import { activeDeviceId, devices } from "@/app/_lib/ssh-manager-data";
import { DeviceWorkspace } from "./DeviceWorkspace";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TerminalPanel } from "./TerminalPanel";

export function SshManagerApp() {
  const totalOnline = devices.filter((device) => device.status === "online").length;
  const activeDevice = devices.find((device) => device.id === activeDeviceId) ?? devices[0];

  return (
    <div className="ssh-shell">
      <Header totalOffline={devices.length - totalOnline} totalOnline={totalOnline} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar activeGroup="all" />
        <DeviceWorkspace activeDevice={activeDevice} rows={devices} />
      </div>
      <TerminalPanel />
    </div>
  );
}
