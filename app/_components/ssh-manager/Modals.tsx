'use client';

import { useState } from 'react';
import { api } from '@/app/_lib/api';
import { Device, EnvironmentId, Settings } from '@/app/_lib/ssh-manager-data';

// ─── Shared primitives ───────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalFrame({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <section className="w-full max-w-[520px] rounded-[3px] border border-ssh-border bg-ssh-header">
      <header className="ssh-section-border flex items-center justify-between px-5 py-3.5">
        <h2 className="text-xs font-semibold text-ssh-heading">{title}</h2>
        <button className="text-[17px] text-ssh-muted-dark hover:text-ssh-text" onClick={onClose}>x</button>
      </header>
      <div className="flex flex-col gap-3.5 p-5">{children}</div>
    </section>
  );
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="ssh-label">{label}</label>
      {children}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ssh-input" {...props} />;
}

function ErrMsg({ msg }: { msg: string }) {
  return <p className="text-[12px] text-ssh-red">{msg}</p>;
}

function SubmitRow({ label, loading, onCancel }: { label: string; loading: boolean; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" className="ssh-button" onClick={onCancel} disabled={loading}>cancel</button>
      <button type="submit" className="ssh-button-success px-4 py-1.5" disabled={loading}>
        {loading ? '…' : label}
      </button>
    </div>
  );
}

// ─── Device form (shared by Add + Edit) ──────────────────────────────────────

type DeviceFormState = {
  name: string;
  hostname: string;
  ip: string;
  port: string;
  user: string;
  env: EnvironmentId;
  group: string;
  tags: string;
  authType: 'key' | 'pass';
  keyPath: string;
  password: string;
};

const EMPTY_FORM: DeviceFormState = {
  name: '', hostname: '', ip: '', port: '22', user: 'ubuntu',
  env: 'dev', group: '', tags: '', authType: 'key', keyPath: '', password: '',
};

function deviceToForm(d: Device): DeviceFormState {
  return {
    name: d.name, hostname: d.hostname, ip: d.ip, port: String(d.port),
    user: d.user, env: d.env, group: d.group, tags: d.tags.join(', '),
    authType: d.authType, keyPath: d.keyPath ?? '', password: '',
  };
}

function DeviceForm({
  init,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  init: DeviceFormState;
  submitLabel: string;
  onSubmit: (data: DeviceFormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<DeviceFormState>(init);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (key: keyof DeviceFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try { await onSubmit(form); }
    catch (ex: any) { setErr(ex.message ?? 'error'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <Field label="name">
        <TextInput placeholder="e.g. web-03" value={form.name} onChange={set('name')} required />
      </Field>
      <div className="flex gap-2.5">
        <Field label="hostname / ip" className="flex-1">
          <TextInput placeholder="192.168.1.x" value={form.hostname} onChange={set('hostname')} required />
        </Field>
        <Field label="port" className="w-[72px]">
          <TextInput placeholder="22" value={form.port} onChange={set('port')} type="number" min="1" max="65535" required />
        </Field>
      </div>
      <div className="flex gap-2.5">
        <Field label="ip address" className="flex-1">
          <TextInput placeholder="10.0.0.1" value={form.ip} onChange={set('ip')} />
        </Field>
        <Field label="user" className="flex-1">
          <TextInput placeholder="ubuntu" value={form.user} onChange={set('user')} required />
        </Field>
      </div>
      <div className="flex gap-2.5">
        <Field label="environment" className="flex-1">
          <select className="ssh-input" value={form.env} onChange={set('env')}>
            <option value="prod">prod</option>
            <option value="staging">staging</option>
            <option value="dev">dev</option>
          </select>
        </Field>
        <Field label="group" className="flex-1">
          <TextInput placeholder="web-servers" value={form.group} onChange={set('group')} />
        </Field>
      </div>
      <div>
        <label className="ssh-label">auth method</label>
        <div className="flex gap-1">
          {(['key', 'pass'] as const).map((t) => (
            <div
              key={t}
              className={`flex flex-1 cursor-pointer items-center gap-2 rounded-[2px] border px-3 py-2 ${
                form.authType === t ? 'border-ssh-border-blue bg-ssh-active text-ssh-text' : 'border-ssh-border text-ssh-muted'
              }`}
              onClick={() => setForm((f) => ({ ...f, authType: t }))}
            >
              <span className={`h-2 w-2 rounded-full ${form.authType === t ? 'bg-ssh-green' : 'border border-ssh-muted-dark'}`} />
              <span className="text-[12px]">{t === 'key' ? 'ssh key' : 'password'}</span>
            </div>
          ))}
        </div>
      </div>
      {form.authType === 'key' ? (
        <Field label="key path">
          <TextInput placeholder="~/.ssh/id_rsa" value={form.keyPath} onChange={set('keyPath')} />
        </Field>
      ) : (
        <Field label="password">
          <TextInput placeholder="••••••••" type="password" value={form.password} onChange={set('password')} />
        </Field>
      )}
      <Field label="tags (comma-separated)">
        <TextInput placeholder="nginx, prod, eu-west" value={form.tags} onChange={set('tags')} />
      </Field>
      {err && <ErrMsg msg={err} />}
      <SubmitRow label={submitLabel} loading={loading} onCancel={onCancel} />
    </form>
  );
}

// ─── Add device ───────────────────────────────────────────────────────────────

export function AddDeviceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  async function handleSubmit(form: DeviceFormState) {
    await api.devices.create({
      name: form.name,
      hostname: form.hostname,
      ip: form.ip,
      port: Number(form.port),
      user: form.user,
      env: form.env as EnvironmentId,
      group: form.group,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      authType: form.authType,
      keyPath: form.authType === 'key' ? form.keyPath || null : null,
      password: form.authType === 'pass' ? form.password || null : null,
    } as any);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalFrame title="new connection" onClose={onClose}>
        <DeviceForm init={EMPTY_FORM} submitLabel="add device" onSubmit={handleSubmit} onCancel={onClose} />
      </ModalFrame>
    </ModalOverlay>
  );
}

// ─── Edit device ─────────────────────────────────────────────────────────────

export function EditDeviceModal({ device, onClose, onSaved }: { device: Device; onClose: () => void; onSaved: () => void }) {
  async function handleSubmit(form: DeviceFormState) {
    await api.devices.update(device.id, {
      name: form.name,
      hostname: form.hostname,
      ip: form.ip,
      port: Number(form.port),
      user: form.user,
      env: form.env as EnvironmentId,
      group: form.group,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      authType: form.authType,
      keyPath: form.authType === 'key' ? form.keyPath || null : null,
      password: form.authType === 'pass' ? (form.password || undefined) : null,
    } as any);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalFrame title={`edit — ${device.name}`} onClose={onClose}>
        <DeviceForm init={deviceToForm(device)} submitLabel="save changes" onSubmit={handleSubmit} onCancel={onClose} />
      </ModalFrame>
    </ModalOverlay>
  );
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [config, setConfig] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await api.devices.import(config);
      setResult(`imported ${res.imported} device${res.imported !== 1 ? 's' : ''}`);
      onImported();
    } catch (ex: any) {
      setErr(ex.message ?? 'import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalFrame title="import ~/.ssh/config" onClose={onClose}>
        {result ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-ssh-green">{result}</p>
            <div className="flex justify-end">
              <button className="ssh-button-success px-4 py-1.5" onClick={onClose}>done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="text-[12px] text-ssh-muted">
              paste your <span className="text-ssh-green">~/.ssh/config</span> below
            </p>
            <textarea
              className="ssh-input h-44 resize-y p-2.5 leading-relaxed"
              placeholder={'Host my-server\n  HostName 192.168.1.10\n  User ubuntu\n  Port 22'}
              value={config}
              onChange={(e) => setConfig(e.target.value)}
            />
            {err && <ErrMsg msg={err} />}
            <SubmitRow label="import" loading={loading} onCancel={onClose} />
          </form>
        )}
      </ModalFrame>
    </ModalOverlay>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function ExportModal({ text, onClose }: { text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalFrame title="export as ssh config" onClose={onClose}>
        <p className="text-[12px] text-ssh-muted">
          copy to <span className="text-ssh-green">~/.ssh/config</span>
        </p>
        <textarea
          className="ssh-input h-48 resize-none p-2.5 leading-relaxed text-ssh-soft"
          readOnly
          value={text}
        />
        <div className="flex justify-end gap-2">
          <button className="ssh-button" onClick={onClose}>close</button>
          <button className="ssh-button-success px-4 py-1.5" onClick={handleCopy}>
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
      </ModalFrame>
    </ModalOverlay>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function SettingsModal({ settings, onClose, onSaved }: { settings: Settings; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api.settings.update(form);
      onSaved();
      onClose();
    } catch (ex: any) {
      setErr(ex.message ?? 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalFrame title="settings" onClose={onClose}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          <SettingToggle
            label="auto-reconnect"
            helper="reconnect dropped sessions automatically"
            value={form.autoReconnect}
            onChange={(v) => setForm((f) => ({ ...f, autoReconnect: v }))}
          />
          <SettingNumber
            label="connection timeout (s)"
            helper="seconds before unreachable"
            value={form.connectionTimeoutSecs}
            onChange={(v) => setForm((f) => ({ ...f, connectionTimeoutSecs: v }))}
          />
          <SettingNumber
            label="ServerAliveInterval (s)"
            helper="keepalive ping every N seconds"
            value={form.serverAliveIntervalSecs}
            onChange={(v) => setForm((f) => ({ ...f, serverAliveIntervalSecs: v }))}
          />
          <SettingNumber
            label="poll interval (s)"
            helper="how often to refresh device metrics"
            value={form.pollIntervalSecs}
            onChange={(v) => setForm((f) => ({ ...f, pollIntervalSecs: v }))}
          />
          <SettingToggle
            label="strict host key checking"
            helper="reject unknown host keys"
            value={form.strictHostKeyChecking}
            onChange={(v) => setForm((f) => ({ ...f, strictHostKeyChecking: v }))}
          />
          {err && <ErrMsg msg={err} />}
          <SubmitRow label="save" loading={loading} onCancel={onClose} />
        </form>
      </ModalFrame>
    </ModalOverlay>
  );
}

function SettingToggle({ label, helper, value, onChange }: { label: string; helper: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-ssh-border-soft py-3">
      <div>
        <div className="mb-0.5 text-[13px] text-ssh-text">{label}</div>
        <div className="text-[11px] text-ssh-muted-dark">{helper}</div>
      </div>
      <button
        type="button"
        className={`relative h-[18px] w-8 rounded-full ${value ? 'bg-ssh-green' : 'border border-ssh-border bg-ssh-active'}`}
        onClick={() => onChange(!value)}
      >
        <div className={`absolute top-0.5 h-3.5 w-3.5 rounded-full ${value ? 'right-0.5 bg-white' : 'left-0.5 bg-ssh-muted-dark'}`} />
      </button>
    </div>
  );
}

function SettingNumber({ label, helper, value, onChange }: { label: string; helper: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-ssh-border-soft py-3">
      <div>
        <div className="mb-0.5 text-[13px] text-ssh-text">{label}</div>
        <div className="text-[11px] text-ssh-muted-dark">{helper}</div>
      </div>
      <input
        type="number"
        className="w-16 rounded-[2px] border border-ssh-border bg-ssh-bg px-2 py-1 text-center text-[13px] text-ssh-text"
        value={value}
        min={1}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
