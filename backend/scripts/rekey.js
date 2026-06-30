'use strict';

/**
 * Re-encrypts all stored passwords with a new ENCRYPTION_KEY.
 *
 * Usage:
 *   OLD_KEY=<current key> NEW_KEY=<new key> node backend/scripts/rekey.js
 *
 * Stop the server before running. Restart with NEW_KEY in .env afterwards.
 */

const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');

const OLD_KEY = process.env.OLD_KEY;
const NEW_KEY = process.env.NEW_KEY;

if (!OLD_KEY || !NEW_KEY) {
  console.error('Usage: OLD_KEY=<current> NEW_KEY=<new> node backend/scripts/rekey.js');
  process.exit(1);
}
if (OLD_KEY === NEW_KEY) {
  console.error('OLD_KEY and NEW_KEY are the same — nothing to do.');
  process.exit(0);
}

const SALT = 'ssh-mgr-v1';
const oldDerivedKey = crypto.scryptSync(OLD_KEY, SALT, 32);
const newDerivedKey = crypto.scryptSync(NEW_KEY, SALT, 32);

function decrypt(stored, key) {
  const { iv, tag, ciphertext } = JSON.parse(stored);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  });
}

const DB_PATH = path.resolve(__dirname, '../data/ssh-mgr.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const rows = db.prepare("SELECT id, password FROM devices WHERE password IS NOT NULL AND password != ''").all();

if (rows.length === 0) {
  console.log('No encrypted passwords found. Nothing to do.');
  process.exit(0);
}

console.log(`Found ${rows.length} device(s) with stored passwords. Re-encrypting...`);

const update = db.prepare('UPDATE devices SET password = ? WHERE id = ?');

const rekey = db.transaction(() => {
  let ok = 0;
  for (const row of rows) {
    let plaintext;
    try {
      plaintext = decrypt(row.password, oldDerivedKey);
    } catch (e) {
      console.error(`  device ${row.id}: decrypt failed — wrong OLD_KEY? Aborting.`);
      throw e;
    }
    update.run(encrypt(plaintext, newDerivedKey), row.id);
    ok++;
    console.log(`  device ${row.id}: OK`);
  }
  return ok;
});

try {
  const count = rekey();
  console.log(`\nDone. ${count} password(s) re-encrypted.`);
  console.log('Update ENCRYPTION_KEY in .env to NEW_KEY and restart the server.');
} catch {
  console.error('\nTransaction rolled back. DB unchanged.');
  process.exit(1);
}
