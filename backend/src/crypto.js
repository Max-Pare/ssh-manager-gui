'use strict';

const crypto = require('crypto');

const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set');
}

// Legacy fixed salt — used only to decrypt records written before per-record salts.
const LEGACY_SALT = 'ssh-mgr-v1';

// scrypt is intentionally slow; cache derived keys by salt so repeated
// encrypt/decrypt (e.g. polling password-auth devices) doesn't re-derive each time.
const keyCache = new Map();
function deriveKey(salt) {
  const cacheKey = Buffer.isBuffer(salt) ? salt.toString('hex') : String(salt);
  let key = keyCache.get(cacheKey);
  if (!key) {
    key = crypto.scryptSync(RAW_KEY, salt, 32);
    keyCache.set(cacheKey, key);
  }
  return key;
}

function encrypt(plaintext) {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 2,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  });
}

function decrypt(stored) {
  const obj = JSON.parse(stored);
  const { iv, tag, ciphertext } = obj;
  // v2 records carry a per-record salt; legacy records use the fixed salt.
  const key = obj.salt ? deriveKey(Buffer.from(obj.salt, 'hex')) : deriveKey(LEGACY_SALT);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
