import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { addressHistory, createInvoice, listInvoices } from '@/lib/db';
import { errorResponse, readJson, sameOrigin } from '@/lib/http';
import { normalizeAddress, normalizeAmount } from '@/lib/payment';
import { checkRecipient, merchantAddress } from '@/lib/rpc';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
    let defaultRecipient = '';
    try { defaultRecipient = merchantAddress(); } catch { /* A default is optional. */ }
    return NextResponse.json({ invoices: listInvoices(), addressHistory: addressHistory(), defaultRecipient }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (!await isAdmin()) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
    const { description, amount, recipient: inputRecipient, expectedPayer: inputPayer } = await readJson(request);
    if (typeof description !== 'string' || !description.trim() || description.trim().length > 120) {
      throw new Error('订单说明应为 1–120 个字符。');
    }
    const normalized = normalizeAmount(amount);
    const recipient = normalizeAddress(inputRecipient, 'recipient');
    const expectedPayer = inputPayer === undefined || inputPayer === null || inputPayer === '' ? null : normalizeAddress(inputPayer, 'payer');
    await checkRecipient(recipient);
    return NextResponse.json({ invoice: createInvoice(description.trim(), normalized, recipient, expectedPayer) }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
