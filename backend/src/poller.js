'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { Client } = require('ssh2');
const db = require('./db');
const { decrypt } = require('./crypto');

const METRICS_CMD = [
  'echo "---CPU---"',
  'top -bn1 | grep "Cpu(s)" | awk \'{print $2}\' | tr -d \'%us,\'',
  'echo "---MEM---"',
  'free -m | awk \'NR==2{printf "%.0f", $3*100/$2}\'',
  'echo "---UPTIME---"',
  'cat /proc/uptime | awk \'{print $1}\'',
  'echo "---OS---"',
  '. /etc/os-release && echo "$PRETTY_NAME"',
].join('; ');

function formatUptime(totalSecs) {
  const secs = Math.floor(totalSecs);
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function parseMetrics(output) {
  const sections = {};
  let current = null;
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (/^---[A-Z]+---$/.test(trimmed)) {
      current = trimmed.slice(3, -3);
      sections[current] = [];
    } else if (current && trimmed) {
      sections[current].push(trimmed);
    }
  }
  return {
    cpu: Math.min(100, Math.max(0, parseFloat(sections['CPU']?.[0] || '0') || 0)),
    ram: Math.min(100, Math.max(0, parseInt(sections['MEM']?.[0] || '0', 10) || 0)),
    uptime: formatUptime(parseFloat(sections['UPTIME']?.[0] || '0')),
    os: sections['OS']?.[0] || '',
  };
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?)').all(
    'connectionTimeoutSecs',
    'pollIntervalSecs'
  );
  const result = { connectionTimeoutSecs: 30, pollIntervalSecs: 30 };
  for (const row of rows) result[row.key] = Number(row.value);
  return result;
}

function buildSSHConfig(device, timeoutSecs) {
  const cfg = {
    host: device.hostname,
    port: device.port || 22,
    username: device.user,
    readyTimeout: timeoutSecs * 1000,
  };

  if (device.authType === 'key') {
    let keyPath = device.keyPath || '~/.ssh/id_rsa';
    if (keyPath.startsWith('~')) keyPath = path.join(os.homedir(), keyPath.slice(1));
    cfg.privateKey = fs.readFileSync(keyPath);
  } else if (device.authType === 'pass' && device.password) {
    cfg.password = decrypt(device.password);
  }

  return cfg;
}

function pollDevice(device) {
  return new Promise((resolve) => {
    const settings = getSettings();
    let sshCfg;

    try {
      sshCfg = buildSSHConfig(device, settings.connectionTimeoutSecs);
    } catch (e) {
      console.error(`[poller] device ${device.id} (${device.name}): config error: ${e.message}`);
      db.prepare('UPDATE devices SET status = ? WHERE id = ?').run('offline', device.id);
      return resolve(false);
    }

    const conn = new Client();
    let settled = false;

    const bail = (markOffline = true) => {
      if (settled) return;
      settled = true;
      if (markOffline) {
        const prev = db.prepare('SELECT status, lastSeen FROM devices WHERE id = ?').get(device.id);
        if (prev?.status === 'online') {
          db.prepare('UPDATE devices SET status = ?, lastSeen = ? WHERE id = ?')
            .run('offline', new Date().toISOString(), device.id);
        } else {
          db.prepare('UPDATE devices SET status = ? WHERE id = ?').run('offline', device.id);
        }
      }
      try { conn.destroy(); } catch {}
      resolve(false);
    };

    // Hard timeout beyond readyTimeout
    const timer = setTimeout(() => bail(true), (settings.connectionTimeoutSecs + 5) * 1000);

    conn.on('ready', () => {
      conn.exec(METRICS_CMD, (err, stream) => {
        if (err) { clearTimeout(timer); bail(true); return; }

        let output = '';
        stream.on('data', (d) => { output += d.toString(); });
        stream.stderr.on('data', (d) => { output += d.toString(); });
        stream.on('close', () => {
          clearTimeout(timer);
          if (settled) return;
          settled = true;

          try {
            const m = parseMetrics(output);
            db.prepare(`
              UPDATE devices
              SET status = 'online', cpu = ?, ram = ?, uptime = ?, os = ?, lastSeen = ?
              WHERE id = ?
            `).run(m.cpu, m.ram, m.uptime, m.os, new Date().toISOString(), device.id);
          } catch (pe) {
            console.error(`[poller] device ${device.id}: parse error: ${pe.message}`);
          }

          conn.end();
          resolve(true);
        });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timer);
      console.error(`[poller] device ${device.id} (${device.name}): ${err.message}`);
      bail(true);
    });

    conn.connect(sshCfg);
  });
}

async function pollAll() {
  const devices = db.prepare('SELECT * FROM devices').all();
  for (const device of devices) {
    try {
      await pollDevice(device);
    } catch (e) {
      console.error(`[poller] device ${device.id}: unexpected error: ${e.message}`);
    }
  }
}

let timer = null;
let stopping = false;

function start() {
  if (timer) return;
  stopping = false;

  async function tick() {
    if (stopping) return;
    try { await pollAll(); } catch (e) { console.error('[poller] poll error:', e.message); }
    if (!stopping) {
      const s = getSettings();
      timer = setTimeout(tick, s.pollIntervalSecs * 1000);
    }
  }

  const s = getSettings();
  console.log(`[poller] started, interval: ${s.pollIntervalSecs}s`);
  timer = setTimeout(tick, s.pollIntervalSecs * 1000);
}

function stop() {
  stopping = true;
  if (timer) { clearTimeout(timer); timer = null; }
}

module.exports = { start, stop, pollDevice, pollAll };
