'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

const DEFAULTS = {
  autoReconnect: true,
  connectionTimeoutSecs: 30,
  serverAliveIntervalSecs: 60,
  strictHostKeyChecking: false,
  pollIntervalSecs: 30,
  envOrder: ['prod', 'staging', 'dev'],
};

function parseValue(key, raw) {
  const def = DEFAULTS[key];
  if (typeof def === 'boolean') return raw === 'true';
  if (typeof def === 'number') return Number(raw);
  if (Array.isArray(def)) {
    try { return JSON.parse(raw); } catch { return def; }
  }
  return raw;
}

function serializeValue(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const result = { ...DEFAULTS };
  for (const row of rows) {
    if (row.key in DEFAULTS) result[row.key] = parseValue(row.key, row.value);
  }
  return result;
}

// GET /api/settings
router.get('/', (req, res) => {
  res.json(getAllSettings());
});

// PUT /api/settings
router.put('/', (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const upsertMany = db.transaction((pairs) => {
    for (const [k, v] of pairs) upsert.run(k, v);
  });

  const pairs = [];
  for (const [key, value] of Object.entries(req.body)) {
    if (key in DEFAULTS) pairs.push([key, serializeValue(value)]);
  }

  upsertMany(pairs);
  res.json(getAllSettings());
});

module.exports = router;
