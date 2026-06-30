'use client';

import { useEffect, useRef } from 'react';

export type TerminalStatus = 'connecting' | 'connected' | 'error' | 'closed';

type Props = {
  sessionId: string;
  ws: WebSocket | null;
  active: boolean;
  onStatusChange: (sessionId: string, status: TerminalStatus) => void;
};

export function Terminal({ sessionId, ws, active, onStatusChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const fitRef = useRef<any>(null);
  const pendingRef = useRef<MessageEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(ws);
  const cbRef = useRef(onStatusChange);
  cbRef.current = onStatusChange;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  useEffect(() => { wsRef.current = ws; }, [ws]);

  useEffect(() => {
    let destroyed = false;
    let roDisconnect: (() => void) | null = null;

    (async () => {
      const [{ Terminal: XTerm }, { FitAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
      ]);
      if (destroyed || !containerRef.current) return;

      const term = new XTerm({
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9',
          cursor: '#58a6ff',
          selectionBackground: 'rgba(88,166,255,0.3)',
        },
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 14,
        lineHeight: 1.5,
        cursorBlink: true,
        scrollback: 5000,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef.current);
      fit.fit();
      termRef.current = term;
      fitRef.current = fit;

      for (const e of pendingRef.current) handleMsg(e, term, sessionIdRef, cbRef);
      pendingRef.current = [];

      term.onData((data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(data);
      });
      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      });

      const ro = new ResizeObserver(() => { try { fit.fit(); } catch {} });
      ro.observe(containerRef.current!);
      roDisconnect = () => ro.disconnect();
    })();

    return () => {
      destroyed = true;
      roDisconnect?.();
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => { try { fitRef.current?.fit(); } catch {} }, 50);
      return () => clearTimeout(t);
    }
  }, [active]);

  useEffect(() => {
    if (!ws) return;
    const onMessage = (e: MessageEvent) => {
      if (termRef.current) handleMsg(e, termRef.current, sessionIdRef, cbRef);
      else pendingRef.current.push(e);
    };
    const onClose = () => {
      termRef.current?.writeln('\r\n\x1b[33m[disconnected]\x1b[0m');
      cbRef.current(sessionIdRef.current, 'closed');
    };
    ws.addEventListener('message', onMessage);
    ws.addEventListener('close', onClose);
    return () => {
      ws.removeEventListener('message', onMessage);
      ws.removeEventListener('close', onClose);
    };
  }, [ws]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ visibility: active ? 'visible' : 'hidden', pointerEvents: active ? 'auto' : 'none' }}
    />
  );
}

function handleMsg(
  e: MessageEvent,
  term: any,
  sessionIdRef: React.RefObject<string>,
  cbRef: React.RefObject<(id: string, s: TerminalStatus) => void>,
) {
  if (typeof e.data === 'string') {
    try {
      const ctrl = JSON.parse(e.data);
      if (ctrl && typeof ctrl === 'object') {
        if (ctrl.type === 'connected') {
          term.writeln('\r\n\x1b[32m[connected]\x1b[0m');
          cbRef.current(sessionIdRef.current, 'connected');
        } else if (ctrl.type === 'error') {
          term.writeln(`\r\n\x1b[31m[error: ${ctrl.message ?? 'unknown error'}]\x1b[0m`);
          cbRef.current(sessionIdRef.current, 'error');
        } else {
          term.write(e.data);
        }
      } else {
        // JSON.parse succeeded but returned a primitive (digit, boolean, null) — raw output
        term.write(e.data);
      }
    } catch {
      term.write(e.data);
    }
  } else if (e.data instanceof ArrayBuffer) {
    term.write(new Uint8Array(e.data));
  } else if (e.data instanceof Blob) {
    e.data.arrayBuffer().then((buf) => term.write(new Uint8Array(buf)));
  }
}
