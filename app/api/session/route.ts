import { NextRequest, NextResponse } from 'next/server';
import { login, logout, validToken } from '@/lib/auth';
import { errorResponse, readJson, sameOrigin } from '@/lib/http';
export const runtime = 'nodejs';
// Bound password attempts globally rather than trusting spoofable forwarded IP headers.
let failures = 0;
let resetAt = Date.now() + 60000;
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (Date.now() > resetAt) { failures = 0; resetAt = Date.now() + 60000; }
    if (failures >= 20) return NextResponse.json({ error: '登录尝试过多，请一分钟后重试。' }, { status: 429 });
    const { token } = await readJson(request);
    if (!validToken(token)) { failures++; return NextResponse.json({ error: '管理口令不正确。' }, { status: 401 }); }
    await login();
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
export async function DELETE(request: NextRequest) {
  try { sameOrigin(request); await logout(); return NextResponse.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}
