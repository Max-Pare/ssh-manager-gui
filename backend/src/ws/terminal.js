'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { Client } = require('ssh2');
const WebSocket = require('ws');
const db = require('../db');
const { decrypt } = require('../crypto');

function handleTerminal(ws, deviceId) {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);

  if (!row) {
    ws.send(JSON.stringify({ type: 'error', message: 'Device not found' }));
    ws.close();
    return;
  }

  if (row.status === 'offline') {
    ws.send(JSON.stringify({ type: 'error', message: 'Device is offline' }));
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

  // Build SSH connection config
  const sshCfg = {
    host: row.hostname,
    port: row.port || 22,
    username: row.user,
    readyTimeout: 30000,
  };

  if (row.authType === 'key') {
    let keyPath = row.keyPath || '~/.ssh/id_rsa';
    if (keyPath.startsWith('~')) keyPath = path.join(os.homedir(), keyPath.slice(1));
    try {
      sshCfg.privateKey = fs.readFileSync(keyPath);
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: `Cannot read key file: ${e.message}` }));
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
      if (ctrl.type === 'resize' && typeof ctrl.cols === 'number' && typeof ctrl.rows === 'number') {
        stream.setWindow(ctrl.rows, ctrl.cols, 0, 0);
      }
    } catch {
      // Raw terminal input — forward to SSH stdin
      stream.write(text);
    }
  });

  ws.on('close', () => closeAll());
  ws.on('error', () => closeAll());

  conn.connect(sshCfg);
}

module.exports = { handleTerminal };
