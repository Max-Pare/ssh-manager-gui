'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { Client } = require('ssh2');
const WebSocket = require('ws');
const db = require('../db');
const { decrypt } = require('../crypto');
const { makeHostVerifier } = require('../hostkey');

function handleTerminal(ws, deviceId) {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);

  if (!row) {
    ws.send(JSON.stringify({ type: 'error', message: 'Device not found' }));
    ws.close();
    return;
  }

  const conn = new Client();
  let stream = null;
  let closed = false;

  function closeAll() {
    if (closed) return;
    closed = true;
    try { if (stream) stream.end(); } catch {}
    try { conn.end(); } catch {}
  }

  function resolveKeyPath(keyPath) {
    if (keyPath) {
      const p = keyPath.startsWith('~') ? path.join(os.homedir(), keyPath.slice(1)) : keyPath;
      if (!fs.existsSync(p)) throw new Error(`Key file not found: ${p}`);
      return p;
    }
    for (const name of ['id_ed25519', 'id_rsa', 'id_ecdsa']) {
      const p = path.join(os.homedir(), '.ssh', name);
      if (fs.existsSync(p)) return p;
    }
    throw new Error('No SSH key found. Set keyPath on the device or place a key at ~/.ssh/id_ed25519 or ~/.ssh/id_rsa');
  }

  // Honor strictHostKeyChecking setting (string 'true'/'false' in DB).
  const strictRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('strictHostKeyChecking');
  const strict = strictRow ? strictRow.value === 'true' : false;

  // Build SSH connection config
  const sshCfg = {
    host: row.ip || row.hostname,  // prefer IP; hostname may not resolve
    port: row.port || 22,
    username: row.user,
    readyTimeout: 30000,
    hostHash: 'sha256',
    hostVerifier: makeHostVerifier(row.id, strict),
  };

  if (row.authType === 'key') {
    try {
      sshCfg.privateKey = fs.readFileSync(resolveKeyPath(row.keyPath));
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
      ws.close();
      return;
    }
  } else if (row.authType === 'pass' && row.password) {
    try {
      sshCfg.password = decrypt(row.password);
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to decrypt stored password' }));
      ws.close();
      return;
    }
  } else if (row.authType === 'pass') {
    ws.send(JSON.stringify({ type: 'error', message: 'Password auth but no password stored — edit device and re-enter password' }));
    ws.close();
    return;
  }

  conn.on('ready', () => {
    ws.send(JSON.stringify({ type: 'connected', deviceId: row.id, deviceName: row.name }));

    conn.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, s) => {
      if (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
        ws.close();
        conn.end();
        return;
      }

      stream = s;

      stream.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data.toString());
      });

      stream.stderr.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data.toString());
      });

      stream.on('close', () => {
        if (ws.readyState === WebSocket.OPEN) ws.close();
        conn.end();
      });
    });
  });

  conn.on('error', (err) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
      ws.close();
    }
  });

  ws.on('message', (msg) => {
    if (!stream || closed) return;
    const text = msg.toString();
    try {
      const ctrl = JSON.parse(text);
      if (ctrl && typeof ctrl === 'object' && ctrl.type === 'resize' &&
          typeof ctrl.cols === 'number' && typeof ctrl.rows === 'number') {
        stream.setWindow(ctrl.rows, ctrl.cols, 0, 0);
      } else {
        stream.write(text);
      }
    } catch {
      stream.write(text);
    }
  });

  ws.on('close', () => closeAll());
  ws.on('error', () => closeAll());

  conn.connect(sshCfg);
}

module.exports = { handleTerminal };
