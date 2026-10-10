import { NextRequest, NextResponse } from 'next/server';
import { type Hash, type Address } from 'viem';
import { getInvoice, markPaid } from '@/lib/db';
import { errorResponse, readJson, sameOrigin, validId } from '@/lib/http';
import { validatePayment } from '@/lib/payment';
import { rpc } from '@/lib/rpc';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ongoing = new Set<string>();
let rpcInFlight = 0;
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let acquired = false;
  try {
    sameOrigin(request);
    const invoice = validId(id) ? getInvoice(id) : undefined;
    if (!invoice) return NextResponse.json({ error: '订单不存在。' }, { status: 404 });
    if (invoice.status === 'paid') return NextResponse.json({ invoice });
    const { hash } = await readJson(request);
    if (typeof hash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(hash)) throw new Error('交易哈希格式无效。');
    if (ongoing.has(id) || rpcInFlight >= 8) return NextResponse.json({ error: '核验处理中，请稍后重试。' }, { status: 429 });
    ongoing.add(id); rpcInFlight++; acquired = true;
    try {
      const [chainId, transaction, receipt] = await Promise.all([
        rpc.getChainId(), rpc.getTransaction({ hash: hash as Hash }), rpc.getTransactionReceipt({ hash: hash as Hash }),
      ]);
      const [block, code] = await Promise.all([
        rpc.getBlock({ blockHash: receipt.blockHash }),
        rpc.getCode({ address: invoice.recipient as Address, blockNumber: receipt.blockNumber }),
      ]);
      const paid = validatePayment(invoice, { chainId, transaction, receipt, block, recipientCode: code || '0x' });
      return NextResponse.json({ invoice: markPaid(id, paid.txHash, paid.payer, paid.paidAt) });
    } catch (error) {
      if (error instanceof Error && /not found|could not be found|HTTP request|fetch failed|timed out/i.test(error.message)) {
        return NextResponse.json({ error: '暂未查到有效回执，或 RPC 暂时不可用。请保留交易哈希，稍后重新核验。' }, { status: 503 });
      }
      throw error;
    }
  } catch (error) { return errorResponse(error); }
  finally { if (acquired) { ongoing.delete(id); rpcInFlight--; } }
}
