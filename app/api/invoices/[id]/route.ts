import { NextResponse } from 'next/server';
import { getInvoice } from '@/lib/db';
import { validId } from '@/lib/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const invoice = validId(id) ? getInvoice(id) : undefined;
  const headers = { 'Cache-Control': 'no-store' };
  return invoice ? NextResponse.json({ invoice }, { headers }) : NextResponse.json({ error: '订单不存在。' }, { status: 404, headers });
}
