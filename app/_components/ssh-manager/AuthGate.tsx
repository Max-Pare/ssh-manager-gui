'use client';

import { useEffect, useState } from 'react';
import { checkAuth, clearToken, getToken, setToken } from '@/app/_lib/api';

type GateState = 'checking' | 'login' | 'ok';

/**
 * Blocks the app until the operator enters a valid API token. The token lives
 * in localStorage only — never in the JS bundle — so loading the page grants
 * nothing without it. A 401 anywhere in the app drops back to this screen.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    const token = getToken();
    if (!token) { setState('login'); return; }
    checkAuth(token)
      .then((ok) => {
        if (!ok) clearToken();
        setState(ok ? 'ok' : 'login');
      })
      .catch(() => setState('login'));
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      clearToken();
      setState('login');
    }
    window.addEventListener('ssh-mgr:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ssh-mgr:unauthorized', onUnauthorized);
  }, []);

  if (state === 'ok') return <>{children}</>;
  if (state === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-ssh-bg text-[13px] text-ssh-muted">
        checking access...
      </div>
    );
  }
  return <LoginForm onAuthed={() => setState('ok')} />;
}

function LoginForm({ onAuthed }: { onAuthed: () => void }) {
  const [token, setTokenInput] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    setErr('');
    setLoading(true);
    try {
      const ok = await checkAuth(trimmed);
      if (!ok) { setErr('invalid token'); return; }
      setToken(trimmed);
      onAuthed();
    } catch {
      setErr('cannot reach backend');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-ssh-bg p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[360px] flex-col gap-3.5 rounded-[3px] border border-ssh-border bg-ssh-header p-5"
      >
        <h1 className="text-xs font-semibold text-ssh-heading">ssh-manager — access</h1>
        <div>
          <label className="ssh-label">api token</label>
          <input
            className="ssh-input"
            type="password"
            autoFocus
            autoComplete="off"
            placeholder="paste API_TOKEN from the server .env"
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
          />
        </div>
        {err && <p className="text-[12px] text-ssh-red">{err}</p>}
        <button type="submit" className="ssh-button-success px-4 py-1.5" disabled={loading || !token.trim()}>
          {loading ? '...' : 'unlock'}
        </button>
      </form>
    </div>
  );
}
