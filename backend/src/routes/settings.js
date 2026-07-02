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

// Bounds for numeric settings. Without a floor, pollIntervalSecs=0 turns the
// poller into a tight loop hammering every device with SSH connections.
const NUMERIC_LIMITS = {
  connectionTimeoutSecs: { min: 5, max: 300 },
  serverAliveIntervalSecs: { min: 0, max: 3600 },
  pollIntervalSecs: { min: 5, max: 86400 },
};

// Returns the validated/clamped value, or undefined if the value is invalid.
function validateValue(key, value) {
  const def = DEFAULTS[key];
  if (typeof def === 'boolean') {
    return typeof value === 'boolean' ? value : undefined;
  }
  if (typeof def === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    const { min, max } = NUMERIC_LIMITS[key];
    return Math.min(max, Math.max(min, Math.round(n)));
  }
  if (Array.isArray(def)) {
    if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) return undefined;
    return value;
  }
  return undefined;
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
    if (!(key in DEFAULTS)) continue;
    const validated = validateValue(key, value);
    if (validated === undefined) {
      return res.status(400).json({ error: `Invalid value for ${key}` });
    }
    pairs.push([key, serializeValue(validated)]);
  }

  upsertMany(pairs);
  res.json(getAllSettings());
});

module.exports = router;
