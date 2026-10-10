import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'arc_invoice_session';
const digest = (text: string) => createHash('sha256').update(text).digest();
const equal = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('请先配置 SESSION_SECRET（至少 32 个字符）。');
  return value;
}
export function validToken(value: unknown) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 32) throw new Error('请先配置 ADMIN_TOKEN（至少 32 个字符）。');
  return typeof value === 'string' && equal(value, expected);
}
export async function login() {
  const expiry = String(Date.now() + 8 * 60 * 60 * 1000);
  const signature = createHmac('sha256', secret()).update(expiry).digest('hex');
  (await cookies()).set(COOKIE, `${expiry}.${signature}`, {
    httpOnly: true, secure: process.env.COOKIE_SECURE !== 'false', sameSite: 'strict',
    path: '/', maxAge: 8 * 60 * 60,
  });
}
export async function isAdmin() {
  const session = (await cookies()).get(COOKIE)?.value;
  if (!session) return false;
  const [expiry, signature] = session.split('.');
  if (!expiry || !signature || !/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return false;
  return equal(signature, createHmac('sha256', secret()).update(expiry).digest('hex'));
}
export async function logout() { (await cookies()).delete(COOKIE); }
