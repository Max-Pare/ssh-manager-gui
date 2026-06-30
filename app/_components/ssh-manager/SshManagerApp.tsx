'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, terminalWsUrl } from '@/app/_lib/api';
import { Device, EnvironmentId, Settings } from '@/app/_lib/ssh-manager-data';
import { TerminalStatus } from './Terminal';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DeviceWorkspace } from './DeviceWorkspace';
import { TerminalPanel, TerminalSession } from './TerminalPanel';
import { AddDeviceModal, EditDeviceModal, ExportModal, ImportModal, SettingsModal } from './Modals';

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; device: Device }
  | { type: 'import' }
  | { type: 'export'; text: string }
  | { type: 'settings'; data: Settings }
  | null;

const DEFAULT_ENV_ORDER: EnvironmentId[] = ['prod', 'staging', 'dev'];

export function SshManagerApp() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterEnv, setFilterEnv] = useState<EnvironmentId | 'all'>('all');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);

  // ── Load devices (no server-side filter — sidebar needs full counts) ────────
  const loadDevices = useCallback(async () => {
    try {
      const data = await api.devices.list();
      setDevices(data);
    } catch (err) {
      console.error('Failed to load devices', err);
    }
  }, []);

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 10_000);
    return () => clearInterval(interval);
  }, [loadDevices]);

  useEffect(() => {
    api.settings.get().then(setSettings).catch(console.error);
  }, []);

  // ── Keyboard shortcut: ctrl+` toggles terminal ─────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); setTerminalVisible((v) => !v); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filteredDevices = devices.filter((d) => {
    if (filterEnv !== 'all' && d.env !== filterEnv) return false;
    if (filterGroup && d.group !== filterGroup) return false;
    if (filterQ) {
      const q = filterQ.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.ip.includes(q) ||
        d.hostname.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalOnline = devices.filter((d) => d.status === 'online').length;
  const activeDevice = filteredDevices.find((d) => d.id === activeDeviceId) ?? null;
  const envOrder = settings?.envOrder ?? DEFAULT_ENV_ORDER;

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const selectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(filteredDevices.map((d) => d.id)) : new Set());

  // ── Terminal sessions ──────────────────────────────────────────────────────
  const openTerminal = (device: Device) => {
    const sessionId = `${device.id}-${Date.now()}`;
    const ws = new WebSocket(terminalWsUrl(device.id));

    setSessions((prev) => [
      ...prev,
      { id: sessionId, deviceId: device.id, deviceName: device.name, status: 'connecting', ws },
    ]);
    setActiveSessionId(sessionId);
    setTerminalVisible(true);

    ws.onerror = () =>
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, status: 'error' as TerminalStatus } : s));
    ws.onclose = () =>
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, status: 'closed' as TerminalStatus } : s));
  };

  const closeTerminal = (sessionId: string) => {
    setSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);
      session?.ws?.close();
      const next = prev.filter((s) => s.id !== sessionId);
      if (activeSessionId === sessionId) setActiveSessionId(next.at(-1)?.id ?? null);
      return next;
    });
  };

  const updateSessionStatus = (sessionId: string, status: TerminalStatus) =>
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, status } : s));

  // ── Device actions ─────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    await api.devices.delete(id);
    if (activeDeviceId === id) setActiveDeviceId(null);
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    loadDevices();
  };

  const handleBulkDelete = async (ids: number[]) => {
    await api.devices.bulkDelete(ids);
    setSelectedIds(new Set());
    if (activeDeviceId !== null && ids.includes(activeDeviceId)) setActiveDeviceId(null);
    loadDevices();
  };

  const handleBulkConnect = (ids: number[]) => {
    ids.forEach((id) => {
      const device = devices.find((d) => d.id === id);
      if (device?.status === 'online') openTerminal(device);
    });
  };

  const handlePoll = async (id: number) => {
    try { await api.devices.poll(id); setTimeout(loadDevices, 1500); }
    catch (err) { console.error('Poll failed', err); }
  };

  const handleExport = async () => {
    try { setModal({ type: 'export', text: await api.devices.export() }); }
    catch (err) { console.error('Export failed', err); }
  };

  const handleOpenSettings = () => {
    if (settings) setModal({ type: 'settings', data: settings });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ssh-shell">
      <Header
        totalOnline={totalOnline}
        totalOffline={devices.length - totalOnline}
        onImport={() => setModal({ type: 'import' })}
        onExport={handleExport}
        onNewDevice={() => setModal({ type: 'add' })}
        onSettings={handleOpenSettings}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          devices={devices}
          envOrder={envOrder}
          activeEnv={filterEnv}
          activeGroup={filterGroup}
          onSelectAll={() => { setFilterEnv('all'); setFilterGroup(null); }}
          onSelectEnv={(env) => { setFilterEnv(env); setFilterGroup(null); }}
          onSelectGroup={(env, group) => { setFilterEnv(env); setFilterGroup(group); }}
        />
        <DeviceWorkspace
          devices={filteredDevices}
          activeDevice={activeDevice}
          selectedIds={selectedIds}
          filterQ={filterQ}
          onFilterQ={setFilterQ}
          onSelectDevice={(id) => setActiveDeviceId((cur) => (cur === id ? null : id))}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          onCloseDetail={() => setActiveDeviceId(null)}
          onConnect={openTerminal}
          onEdit={(d) => setModal({ type: 'edit', device: d })}
          onDelete={handleDelete}
          onPoll={handlePoll}
          onBulkDelete={handleBulkDelete}
          onBulkConnect={handleBulkConnect}
        />
      </div>

      {terminalVisible && sessions.length > 0 && (
        <TerminalPanel
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onCloseSession={closeTerminal}
          onStatusChange={updateSessionStatus}
          onToggleVisible={() => setTerminalVisible(false)}
        />
      )}

      {modal?.type === 'add' && (
        <AddDeviceModal onClose={() => setModal(null)} onSaved={loadDevices} />
      )}
      {modal?.type === 'edit' && (
        <EditDeviceModal device={modal.device} onClose={() => setModal(null)} onSaved={loadDevices} />
      )}
      {modal?.type === 'import' && (
        <ImportModal onClose={() => setModal(null)} onImported={loadDevices} />
      )}
      {modal?.type === 'export' && (
        <ExportModal text={modal.text} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'settings' && (
        <SettingsModal
          settings={modal.data}
          onClose={() => setModal(null)}
          onSaved={() => api.settings.get().then(setSettings).catch(console.error)}
        />
      )}
    </div>
  );
}
