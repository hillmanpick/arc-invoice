import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUnits, type Hash } from 'viem';
import { invoiceData } from '../lib/arc';
import { assertPayer, normalizeAddress, normalizeAmount, validatePayment, type PaymentEvidence } from '../lib/payment';
import type { Invoice } from '../lib/models';
const invoice: Invoice = {
  id: 'eb289a1b-745b-4ec4-8284-a640d5f54524', description: 'demo', amount: '0.01',
  recipient: '0x1111111111111111111111111111111111111111', status: 'pending',
  createdAt: 1000000, txHash: null, payer: null, paidAt: null, expectedPayer: null,
};
const hash = `0x${'a'.repeat(64)}` as Hash;
const blockHash = `0x${'b'.repeat(64)}` as Hash;
function evidence(): PaymentEvidence { return {
  chainId: 5042, recipientCode: '0x',
  transaction: { hash, to: invoice.recipient, from: '0x2222222222222222222222222222222222222222', value: parseUnits('0.01', 18), input: invoiceData(invoice.id), blockHash },
  receipt: { status: 'success', transactionHash: hash, blockHash },
  block: { hash: blockHash, timestamp: 1001n },
}; }
test('USDC amount uses exact decimal arithmetic and rejects malformed amounts', () => {
  assert.equal(normalizeAmount('0001.230000'), '1.23');
  assert.equal(normalizeAmount('0.010001'), '0.010001');
  for (const value of ['0', '0.001', '-1', '1e3', '1000.000001', '1.0000001', 'NaN', 1]) assert.throws(() => normalizeAmount(value));
});
test('successful native USDC transfer linked to order is accepted', () => {
  assert.deepEqual(validatePayment(invoice, evidence()), { txHash: hash, payer: evidence().transaction.from, paidAt: 1001000 });
});

test('recipient and optional payer addresses reject invalid, zero and bad-checksum values', () => {
  assert.equal(normalizeAddress(` ${invoice.recipient} `, 'recipient'), invoice.recipient);
  for (const value of [undefined, 1, '', '0x1234', '0x0000000000000000000000000000000000000000', '0xAb9e4362ced96d403dab09e0561aded7b20e96d6']) {
    assert.throws(() => normalizeAddress(value, 'recipient'));
    assert.throws(() => normalizeAddress(value, 'payer'));
  }
});

test('required payer is enforced both before signing and during receipt verification', () => {
  const e = evidence();
  const required = { ...invoice, expectedPayer: e.transaction.from };
  assert.doesNotThrow(() => assertPayer(null, e.transaction.from));
  assert.doesNotThrow(() => assertPayer(e.transaction.from.toUpperCase(), e.transaction.from));
  assert.equal(validatePayment(required, e).payer, e.transaction.from);
  e.transaction.from = invoice.recipient;
  assert.throws(() => assertPayer(required.expectedPayer, e.transaction.from), /指定付款地址/);
  assert.throws(() => validatePayment(required, e), /指定付款地址/);
});
test('wrong network, reverted receipt, contract receiver and stale block are rejected', () => {
  for (const update of [
    (e: PaymentEvidence) => { e.chainId = 1; },
    (e: PaymentEvidence) => { e.receipt.status = 'reverted'; },
    (e: PaymentEvidence) => { e.recipientCode = '0x01'; },
    (e: PaymentEvidence) => { e.block.timestamp = 999n; },
    (e: PaymentEvidence) => { e.receipt.blockHash = hash; },
  ]) { const e = evidence(); update(e); assert.throws(() => validatePayment(invoice, e)); }
});
test('incorrect address, amount, reused other-order ID and six-decimal transfer are rejected', () => {
  for (const update of [
    (e: PaymentEvidence) => { e.transaction.to = e.transaction.from; },
    (e: PaymentEvidence) => { e.transaction.value = parseUnits('0.02', 18); },
    (e: PaymentEvidence) => { e.transaction.value = parseUnits('0.01', 6); },
    (e: PaymentEvidence) => { e.transaction.input = invoiceData('other-order'); },
    (e: PaymentEvidence) => { e.transaction.input = '0x'; },
  ]) { const e = evidence(); update(e); assert.throws(() => validatePayment(invoice, e)); }
});
