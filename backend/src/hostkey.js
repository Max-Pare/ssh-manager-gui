'use strict';

const crypto = require('crypto');
const db = require('./db');

// Constant-time compare of two hex fingerprint strings.
function fpEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Build an ssh2 hostVerifier for a device. Used with `hostHash: 'sha256'`, so
 * ssh2 passes the server host key as a sha256 hex string.
 *
 * Trust model:
 *   - Stored fingerprint exists  → accept only on exact match (reject = possible MITM).
 *   - No stored fingerprint, strict=false → trust-on-first-use: record and accept.
 *   - No stored fingerprint, strict=true  → reject; key must be pre-provisioned.
 *
 * deviceId is re-read from the DB on each call so a freshly-recorded TOFU key is
 * seen by concurrent connections, and so an operator clearing hostKey re-arms TOFU.
 */
function makeHostVerifier(deviceId, strict) {
  return function hostVerifier(hashedKey, cb) {
    let stored = null;
    try {
      const row = db.prepare('SELECT hostKey FROM devices WHERE id = ?').get(deviceId);
      stored = row ? row.hostKey : null;
    } catch (e) {
      console.error(`[hostkey] device ${deviceId}: DB read failed: ${e.message}`);
      return cb(false);
    }

    if (stored) {
      const ok = fpEqual(hashedKey, stored);
      if (!ok) {
        console.error(
          `[hostkey] device ${deviceId}: HOST KEY MISMATCH — refusing connection. ` +
          `expected ${stored}, got ${hashedKey}. Possible MITM, or the host key was ` +
          `rotated (clear hostKey on the device to re-trust).`
        );
      }
      return cb(ok);
    }

    if (strict) {
      console.error(
        `[hostkey] device ${deviceId}: no trusted host key and strictHostKeyChecking is on — ` +
        `refusing. Provision the host key first.`
      );
      return cb(false);
    }

    // Trust-on-first-use: record the fingerprint, then accept.
    try {
      db.prepare('UPDATE devices SET hostKey = ? WHERE id = ?').run(hashedKey, deviceId);
      console.log(`[hostkey] device ${deviceId}: recorded host key on first use (${hashedKey}).`);
    } catch (e) {
      console.error(`[hostkey] device ${deviceId}: failed to record host key: ${e.message}`);
      return cb(false);
    }
    return cb(true);
  };
}

module.exports = { makeHostVerifier };
