import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { addressHistory, database, createInvoice, getInvoice, listInvoices, markPaid } from '../lib/db';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'arc-invoice-test-'));
const legacy = new DatabaseSync(join(process.env.DATA_DIR, 'invoices.sqlite'));
legacy.exec(`CREATE TABLE invoices (id TEXT PRIMARY KEY, description TEXT NOT NULL, amount TEXT NOT NULL,
  recipient TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', createdAt INTEGER NOT NULL,
  txHash TEXT UNIQUE, payer TEXT, paidAt INTEGER);
  INSERT INTO invoices VALUES ('legacy','existing receipt','0.01','0x1111111111111111111111111111111111111111',
  'paid',100,'legacy-hash','0x2222222222222222222222222222222222222222',200);`);
legacy.close();
after(() => { database().close(); rmSync(process.env.DATA_DIR!, { recursive: true, force: true }); });
test('additive migration preserves legacy paid invoices and does not require a payer', () => {
  const invoice = getInvoice('legacy')!;
  assert.equal(invoice.status, 'paid'); assert.equal(invoice.txHash, 'legacy-hash');
  assert.equal(invoice.expectedPayer, null); assert.equal(invoice.paidAt, 200);
  assert.equal(database(), database());
});
test('address history deduplicates case, uses all invoices, and excludes unverified payers', () => {
  const recipient = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const payer = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const first = createInvoice('one', '0.01', recipient, payer);
  const second = createInvoice('two', '0.01', recipient.toUpperCase(), payer);
  assert.equal(getInvoice(first.id)?.expectedPayer, payer);
  assert.equal(addressHistory().recipients.find(a => a.address === recipient)?.count, 2);
  assert.ok(!addressHistory().payers.some(a => a.address === payer));
  markPaid(first.id, 'history-hash-one', payer, 300);
  markPaid(second.id, 'history-hash-two', payer.toUpperCase(), 400);
  // Older addresses remain available even beyond the 200-invoice ledger window.
  const insert = database().prepare('INSERT INTO invoices(id,description,amount,recipient,createdAt) VALUES (?,?,?,?,?)');
  for (let i = 0; i < 205; i++) insert.run(`bulk-${i}`, 'bulk', '0.01', '0x3333333333333333333333333333333333333333', Date.now() + i + 100);
  assert.equal(listInvoices().length, 200);
  const history = addressHistory();
  assert.equal(history.recipients.find(a => a.address === recipient)?.count, 2);
  assert.deepEqual(history.payers.find(a => a.address === payer), { address: payer, count: 2, lastUsedAt: 400 });
});
test('paid receipt is idempotent and a hash cannot settle a second invoice', () => {
  const first = createInvoice('first', '0.01', '0x1111111111111111111111111111111111111111');
  const second = createInvoice('second', '0.01', first.recipient);
  assert.equal(Object.getPrototypeOf(first), Object.prototype);
  assert.equal(Object.getPrototypeOf(listInvoices()[0]), Object.prototype);
  const hash = `0x${'a'.repeat(64)}`;
  assert.equal(markPaid(first.id, hash, first.recipient, Date.now()).status, 'paid');
  assert.equal(markPaid(first.id, hash, first.recipient, Date.now()).txHash, hash);
  assert.throws(() => markPaid(second.id, hash, first.recipient, Date.now()), /另一笔订单/);
  assert.equal(getInvoice(second.id)?.status, 'pending');
  assert.throws(() => markPaid(first.id, `0x${'b'.repeat(64)}`, first.recipient, Date.now()), /另一笔交易/);
  assert.equal(getInvoice(first.id)?.txHash, hash);
});
