import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Invoice } from './models';

let db: DatabaseSync | undefined;
export function database() {
  if (db) return db;
  const dir = resolve(process.env.DATA_DIR || './data');
  mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(join(dir, 'invoices.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY, description TEXT NOT NULL, amount TEXT NOT NULL,
      recipient TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
      createdAt INTEGER NOT NULL, txHash TEXT UNIQUE, payer TEXT, paidAt INTEGER
    );`);
  return db;
}
export function createInvoice(description: string, amount: string, recipient: string): Invoice {
  const id = randomUUID();
  database().prepare('INSERT INTO invoices (id,description,amount,recipient,createdAt) VALUES (?,?,?,?,?)')
    .run(id, description, amount, recipient, Date.now());
  return getInvoice(id)!;
}
export function getInvoice(id: string) {
  const row = database().prepare('SELECT * FROM invoices WHERE id=?').get(id);
  // node:sqlite returns null-prototype objects; React server/client props need plain objects.
  return row ? { ...row } as unknown as Invoice : undefined;
}
export function listInvoices() {
  return database().prepare('SELECT * FROM invoices ORDER BY createdAt DESC LIMIT 200').all()
    .map(row => ({ ...row })) as unknown as Invoice[];
}
export function markPaid(id: string, hash: string, payer: string, paidAt: number) {
  try {
    database().prepare("UPDATE invoices SET status='paid',txHash=?,payer=?,paidAt=? WHERE id=? AND status='pending'")
      .run(hash.toLowerCase(), payer, paidAt, id);
  } catch (error) {
    if (String(error).includes('UNIQUE')) throw new Error('该交易已经用于另一笔订单。');
    throw error;
  }
  const invoice = getInvoice(id);
  if (!invoice || invoice.txHash !== hash.toLowerCase()) throw new Error('订单已由另一笔交易结算。');
  return invoice;
}
