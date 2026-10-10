import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export function errorResponse(error: unknown, fallback = '请求失败，请稍后重试。', status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status });
}
export function sameOrigin(request: NextRequest) {
  // Use the browser's forwarded host after a TLS reverse proxy; never trust IP headers for quotas.
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) throw new Error('请求来源不匹配。');
}
export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('请求内容为空。');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new Error('请求内容过大。'); }
    chunks.push(value);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('请求格式无效。');
  return body;
}
export const validId = (id: string) => /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id);
