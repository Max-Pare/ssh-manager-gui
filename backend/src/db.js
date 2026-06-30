'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'ssh-mgr.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// --- Versioned migrations ---

db.exec(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL DEFAULT 0)`);

const vRow = db.prepare('SELECT version FROM schema_version LIMIT 1').get();
if (!vRow) db.exec('INSERT INTO schema_version (version) VALUES (0)');
const currentVersion = vRow ? vRow.version : 0;

const MIGRATIONS = [
  // v1: initial schema
  `
  CREATE TABLE IF NOT EXISTS devices (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    hostname  TEXT NOT NULL,
    ip        TEXT DEFAULT '',
    port      INTEGER DEFAULT 22,
    user      TEXT DEFAULT 'root',
    authType  TEXT DEFAULT 'key',
    keyPath   TEXT,
    password  TEXT,
    env       TEXT DEFAULT 'dev',
    grp       TEXT DEFAULT 'default',
    tags      TEXT DEFAULT '[]',
    os        TEXT DEFAULT '',
    cpu       INTEGER DEFAULT 0,
    ram       INTEGER DEFAULT 0,
    uptime    TEXT DEFAULT '—',
    status    TEXT DEFAULT 'offline',
    lastSeen  TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  // v2: trusted SSH host-key fingerprint (sha256 hex) for host-key verification
  `
  ALTER TABLE devices ADD COLUMN hostKey TEXT;
  `,
];

for (let i = currentVersion; i < MIGRATIONS.length; i++) {
  db.exec(MIGRATIONS[i]);
  db.prepare('UPDATE schema_version SET version = ?').run(i + 1);
}

// --- Seed default settings on first run ---

function seedSettings() {
  const count = db.prepare('SELECT COUNT(*) as c FROM settings').get().c;
  if (count > 0) return;

  const pollIntervalSecs = parseInt(process.env.POLL_INTERVAL_SECS, 10) || 30;

  const rows = [
    ['autoReconnect', 'true'],
    ['connectionTimeoutSecs', '30'],
    ['serverAliveIntervalSecs', '60'],
    ['strictHostKeyChecking', 'false'],
    ['pollIntervalSecs', String(pollIntervalSecs)],
    ['envOrder', JSON.stringify(['prod', 'staging', 'dev'])],
  ];

  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const insertMany = db.transaction((data) => {
    for (const [k, v] of data) insert.run(k, v);
  });
  insertMany(rows);
}

seedSettings();

module.exports = db;
