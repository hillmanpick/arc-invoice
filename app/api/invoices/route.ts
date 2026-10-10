import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { createInvoice, listInvoices } from '@/lib/db';
import { errorResponse, readJson, sameOrigin } from '@/lib/http';
import { normalizeAmount } from '@/lib/payment';
import { checkMerchant } from '@/lib/rpc';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
    return NextResponse.json({ invoices: listInvoices() });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (!await isAdmin()) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
    const { description, amount } = await readJson(request);
    if (typeof description !== 'string' || !description.trim() || description.trim().length > 120) {
      throw new Error('订单说明应为 1–120 个字符。');
    }
    const normalized = normalizeAmount(amount);
    const recipient = await checkMerchant();
    return NextResponse.json({ invoice: createInvoice(description.trim(), normalized, recipient) }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
