import { parseUnits, type Hex } from 'viem';
import { arc, invoiceData } from './arc';
import type { Invoice } from './models';

export function normalizeAmount(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{1,4}(\.\d{1,6})?$/.test(value)) {
    throw new Error('金额必须为数字，最多六位小数。');
  }
  const units = parseUnits(value, 18);
  if (units < parseUnits('0.01', 18) || units > parseUnits('1000', 18)) {
    throw new Error('演示订单金额范围为 0.01–1000 USDC。');
  }
  const [whole, fraction = ''] = value.split('.');
  const trimmed = fraction.replace(/0+$/, '');
  return `${BigInt(whole)}${trimmed ? `.${trimmed}` : ''}`;
}

export interface PaymentEvidence {
  chainId: number;
  recipientCode: Hex;
  transaction: { hash: Hex; to: string | null; from: string; value: bigint; input: Hex; blockHash: Hex | null };
  receipt: { status: 'success' | 'reverted'; transactionHash: Hex; blockHash: Hex };
  block: { hash: Hex | null; timestamp: bigint };
}

// Accept only a successful, exact native-USDC payment bearing this order's ID.
export function validatePayment(invoice: Invoice, e: PaymentEvidence) {
  if (e.chainId !== arc.id) throw new Error('RPC 不是 Arc 主网。');
  if (e.recipientCode !== '0x') throw new Error('此版本仅支持普通钱包收款地址。');
  if (e.receipt.status !== 'success') throw new Error('交易执行失败。');
  if (e.receipt.transactionHash.toLowerCase() !== e.transaction.hash.toLowerCase() ||
      e.receipt.blockHash !== e.transaction.blockHash || e.block.hash !== e.receipt.blockHash) {
    throw new Error('交易与区块回执不一致。');
  }
  if (e.transaction.to?.toLowerCase() !== invoice.recipient.toLowerCase()) throw new Error('收款地址不匹配。');
  if (e.transaction.value !== parseUnits(invoice.amount, 18)) throw new Error('付款金额不匹配。');
  if (e.transaction.input.toLowerCase() !== invoiceData(invoice.id).toLowerCase()) throw new Error('交易不属于此订单。');
  if (Number(e.block.timestamp) < Math.floor(invoice.createdAt / 1000)) throw new Error('交易早于订单创建。');
  return { txHash: e.transaction.hash, payer: e.transaction.from, paidAt: Number(e.block.timestamp) * 1000 };
}
