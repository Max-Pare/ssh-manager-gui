'use strict';

const express = require('express');
const SSHConfig = require('ssh-config');
const db = require('../db');
const { encrypt } = require('../crypto');
const poller = require('../poller');

const router = express.Router();

function deviceToAPI(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    hostname: row.hostname,
    ip: row.ip,
    port: row.port,
    user: row.user,
    authType: row.authType,
    keyPath: row.keyPath,
    password: null, // never expose stored value
    env: row.env,
    group: row.grp,
    tags: JSON.parse(row.tags || '[]'),
    os: row.os,
    cpu: row.cpu,
    ram: row.ram,
    uptime: row.uptime,
    status: row.status,
    lastSeen: row.lastSeen,
    createdAt: row.createdAt,
  };
}

// GET /api/devices/export  — must be before /:id
router.get('/export', (req, res) => {
  const rows = db.prepare('SELECT * FROM devices ORDER BY id ASC').all();
  const lines = [];

  for (const row of rows) {
    lines.push(`Host ${row.name}`);
    lines.push(`  HostName ${row.hostname}`);
    lines.push(`  User ${row.user}`);
    if (row.port !== 22) lines.push(`  Port ${row.port}`);
    if (row.authType === 'key' && row.keyPath) lines.push(`  IdentityFile ${row.keyPath}`);
    lines.push('');
  }

  res.type('text/plain').send(lines.join('\n'));
});

// POST /api/devices/import  — must be before /:id
router.post('/import', (req, res) => {
  const { config: configText } = req.body;
  if (!configText) return res.status(400).json({ error: 'config is required' });

  let parsed;
  try {
    parsed = SSHConfig.parse(configText);
  } catch (e) {
    return res.status(400).json({ error: `Failed to parse SSH config: ${e.message}` });
  }

  const insert = db.prepare(`
    INSERT INTO devices
      (name, hostname, ip, port, user, authType, keyPath, env, grp, tags, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'dev', 'imported', '["imported"]', 'offline', ?)
  `);

  const now = new Date().toISOString();
  const created = [];

  for (const section of parsed) {
    if (section.param !== 'Host' || section.value === '*') continue;

    const name = section.value;
    let hostname = name, port = 22, user = 'root', keyPath = null;

    for (const entry of (section.config || [])) {
      if (!entry.param) continue;
      switch (entry.param) {
        case 'HostName':      hostname = entry.value; break;
        case 'Port':          port = parseInt(entry.value, 10) || 22; break;
        case 'User':          user = entry.value; break;
        case 'IdentityFile':  keyPath = entry.value; break;
      }
    }

    const authType = keyPath ? 'key' : 'pass';
    const info = insert.run(name, hostname, hostname, port, user, authType, keyPath, now);
    const newRow = db.prepare('SELECT * FROM devices WHERE id = ?').get(info.lastInsertRowid);
    created.push(deviceToAPI(newRow));
  }

  res.json({ imported: created.length, devices: created });
});

// POST /api/devices/poll (all)  — must be before /:id
router.post('/poll', async (req, res) => {
  try {
    await poller.pollAll();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/devices
router.get('/', (req, res) => {
  const { env, group, q } = req.query;
  let sql = 'SELECT * FROM devices WHERE 1=1';
  const params = [];

  if (env)   { sql += ' AND env = ?'; params.push(env); }
  if (group) { sql += ' AND grp = ?'; params.push(group); }
  if (q) {
    sql += ' AND (name LIKE ? OR hostname LIKE ? OR ip LIKE ? OR tags LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  sql += ' ORDER BY id ASC';
  res.json(db.prepare(sql).all(...params).map(deviceToAPI));
});

// POST /api/devices
router.post('/', (req, res) => {
  const {
    name, hostname, ip, port = 22, user = 'root',
    authType = 'key', keyPath, password,
    env = 'dev', group = 'default', tags = [],
  } = req.body;

  if (!name)     return res.status(400).json({ error: 'name is required' });
  if (!hostname) return res.status(400).json({ error: 'hostname is required' });

  if (keyPath && keyPath.includes('..')) {
    return res.status(400).json({ error: 'keyPath must not contain path traversal' });
  }

  const effectiveIp = (ip && ip.trim()) ? ip : hostname;
  let encryptedPassword = null;
  if (authType === 'pass' && password) encryptedPassword = encrypt(password);

  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO devices
      (name, hostname, ip, port, user, authType, keyPath, password, env, grp, tags, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, hostname, effectiveIp, port, user, authType,
    keyPath || null, encryptedPassword, env, group, JSON.stringify(tags), now
  );

  const newRow = db.prepare('SELECT * FROM devices WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(deviceToAPI(newRow));
});

// GET /api/devices/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Device not found' });
  res.json(deviceToAPI(row));
});

// PUT /api/devices/:id  (PATCH semantics)
router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Device not found' });

  // hostKey is deliberately NOT updatable here — overwriting the pinned
  // fingerprint would silently defeat MITM detection. Use DELETE /:id/hostkey
  // to re-arm trust-on-first-use after a legitimate host key rotation.
  const ALLOWED = ['name', 'hostname', 'ip', 'port', 'user', 'authType', 'keyPath',
                   'password', 'env', 'group', 'tags', 'os', 'cpu', 'ram', 'uptime',
                   'status', 'lastSeen'];

  const cols = {};
  for (const field of ALLOWED) {
    if (!(field in req.body)) continue;
    const val = req.body[field];

    if (field === 'group') {
      cols.grp = val;
    } else if (field === 'tags') {
      cols.tags = JSON.stringify(Array.isArray(val) ? val : []);
    } else if (field === 'password') {
      if (val) cols.password = encrypt(val);
    } else if (field === 'keyPath') {
      if (val && val.includes('..')) {
        return res.status(400).json({ error: 'keyPath must not contain path traversal' });
      }
      cols.keyPath = val;
    } else {
      cols[field] = val;
    }
  }

  if (Object.keys(cols).length > 0) {
    const set = Object.keys(cols).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE devices SET ${set} WHERE id = ?`).run(...Object.values(cols), req.params.id);
  }

  res.json(deviceToAPI(db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)));
});

// DELETE /api/devices/:id
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT id FROM devices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Device not found' });
  db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/devices  (bulk)
router.delete('/', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }
  const ph = ids.map(() => '?').join(', ');
  db.prepare(`DELETE FROM devices WHERE id IN (${ph})`).run(...ids);
  res.json({ ok: true, deleted: ids.length });
});

// DELETE /api/devices/:id/hostkey — clear the pinned host key fingerprint,
// re-arming trust-on-first-use (use after a legitimate host key rotation).
router.delete('/:id/hostkey', (req, res) => {
  const row = db.prepare('SELECT id FROM devices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Device not found' });
  db.prepare('UPDATE devices SET hostKey = NULL WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/devices/:id/poll
router.post('/:id/poll', async (req, res) => {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Device not found' });

  try {
    await poller.pollDevice(row);
    const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
    res.json(deviceToAPI(updated));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
