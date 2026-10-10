// Node 22.16+ online backup API includes committed WAL data consistently.
const { DatabaseSync, backup } = require('node:sqlite');
const { mkdirSync, chmodSync } = require('node:fs');
const { join, resolve } = require('node:path');
async function main() {
  const dataDir = resolve(process.env.DATA_DIR || './data');
  const db = new DatabaseSync(join(dataDir, 'invoices.sqlite'), { readOnly: true });
  const directory = join(dataDir, 'backups');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = `invoices-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
  const destination = join(directory, filename);
  try { await backup(db, destination); } finally { db.close(); }
  chmodSync(destination, 0o600);
  const check = new DatabaseSync(destination, { readOnly: true });
  try {
    const integrity = check.prepare('PRAGMA integrity_check').get().integrity_check;
    if (integrity !== 'ok') throw new Error('Backup integrity check failed');
    const orders = check.prepare('SELECT COUNT(*) AS count FROM invoices').get().count;
    console.log(JSON.stringify({ filename, integrity, orders }));
  } finally { check.close(); }
}
main().catch(error => { console.error(error.message); process.exit(1); });
