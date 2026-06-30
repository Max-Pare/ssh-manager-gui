'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

// Private keys must live inside this directory. Override with SSH_KEY_DIR.
const KEY_DIR = process.env.SSH_KEY_DIR
  ? path.resolve(process.env.SSH_KEY_DIR)
  : path.join(os.homedir(), '.ssh');

const DEFAULT_KEYS = ['id_ed25519', 'id_rsa', 'id_ecdsa'];

// Resolve the real base dir once; throws if it doesn't exist.
function realBase() {
  return fs.realpathSync(KEY_DIR);
}

// True if `target` (a real, absolute path) is the base dir or sits inside it.
function isInside(base, target) {
  return target === base || target.startsWith(base + path.sep);
}

/**
 * Resolve a device keyPath to an absolute file path, confined to KEY_DIR.
 * Blocks path traversal, absolute paths outside KEY_DIR, and symlinks that
 * escape it (realpath is compared against the real base dir).
 */
function resolveKeyPath(keyPath) {
  let base;
  try {
    base = realBase();
  } catch {
    throw new Error(`SSH key directory not found: ${KEY_DIR}`);
  }

  if (keyPath) {
    const expanded = keyPath.startsWith('~')
      ? path.join(os.homedir(), keyPath.slice(1))
      : keyPath;
    // Relative paths resolve against the key dir; absolute paths are taken as-is.
    const abs = path.resolve(base, expanded);
    if (!fs.existsSync(abs)) throw new Error(`Key file not found: ${abs}`);
    const real = fs.realpathSync(abs);
    if (!isInside(base, real)) {
      throw new Error(`keyPath must be inside the SSH key directory (${KEY_DIR})`);
    }
    return real;
  }

  for (const name of DEFAULT_KEYS) {
    const p = path.join(KEY_DIR, name);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `No SSH key found. Set keyPath on the device or place a key in ${KEY_DIR} ` +
    `(${DEFAULT_KEYS.join(', ')}).`
  );
}

module.exports = { resolveKeyPath, KEY_DIR };
