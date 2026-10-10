'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import type { Invoice } from '@/lib/models';

async function jsonRequest(path: string, method: string, body?: unknown) {
  const response = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '请求失败。');
  return result;
}
export function AdminPanel({ authenticated }: { authenticated: boolean }) {
  const [loggedIn, setLoggedIn] = useState(authenticated);
  const [token, setToken] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Invoice | null>(null);
  async function refresh() {
    try { setInvoices((await jsonRequest('/api/invoices', 'GET')).invoices); }
    catch (error) { setMessage(error instanceof Error ? error.message : '加载失败。'); }
  }
  useEffect(() => { if (loggedIn) void refresh(); }, [loggedIn]);
  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await jsonRequest('/api/session', 'POST', { token }); setToken(''); setLoggedIn(true); }
    catch (error) { setMessage(error instanceof Error ? error.message : '登录失败。'); }
    finally { setBusy(false); }
  }
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setNewInvoice(null);
    try {
      const { invoice } = await jsonRequest('/api/invoices', 'POST', { description, amount });
      setNewInvoice(invoice); setDescription(''); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : '创建失败。'); }
    finally { setBusy(false); }
  }
  async function copy(id: string) {
    const url = `${window.location.origin}/pay/${id}`;
    try { await navigator.clipboard.writeText(url); setMessage('付款链接已复制。'); }
    catch { setMessage(`付款链接：${url}`); }
  }
  return <main className="shell">
    <nav><Link href="/" className="brand">◈ Arc Invoice</Link><span className="network-badge">Arc 主网</span></nav>
    <header className="page-heading"><div className="eyebrow">MERCHANT WORKSPACE</div><h1>收款工作台</h1><p>创建订单、分享付款链接，查看到账凭证。</p></header>
    {!loggedIn ? <section className="card login-card"><h2>商户登录</h2><p className="muted">使用部署时设置的管理口令。</p><form onSubmit={signIn}><label htmlFor="token">管理口令</label><input id="token" type="password" autoComplete="current-password" required value={token} onChange={e => setToken(e.target.value)} /><button className="button primary" disabled={busy}>{busy ? '登录中…' : '进入工作台 →'}</button></form></section> : <>
      <div className="workspace">
        <section className="card"><h2>新建收款订单</h2><form onSubmit={create}>
          <label htmlFor="description">订单说明</label><input id="description" maxLength={120} required placeholder="例如：Arc Invoice 演示订单" value={description} onChange={e => setDescription(e.target.value)} />
          <label htmlFor="amount">金额 / USDC</label><input id="amount" inputMode="decimal" required value={amount} onChange={e => setAmount(e.target.value)} />
          <p className="hint">首次演示建议使用 0.01 USDC，另外准备网络手续费。</p>
          <button className="button primary" disabled={busy}>{busy ? '正在创建…' : '生成付款链接 →'}</button>
        </form></section>
        <section className="card accent-card"><div className="eyebrow">DIRECT SETTLEMENT</div><h2>收款直接进入<br />你的钱包。</h2><p>订单创建时固定收款地址和金额。系统以实际链上交易确认付款结果。</p>
          {newInvoice && <div className="created"><strong>订单已创建</strong><p>{newInvoice.description} · {newInvoice.amount} USDC</p><div className="actions"><button className="button secondary" onClick={() => copy(newInvoice.id)}>复制链接</button><Link className="button secondary" href={`/pay/${newInvoice.id}`}>打开付款页 ↗</Link></div></div>}
        </section>
      </div>
      <section className="card ledger"><div className="section-heading"><h2>最近订单</h2><button className="text-button" onClick={refresh}>刷新 ↻</button></div>
        {!invoices.length ? <p className="empty">还没有订单。从创建第一条付款链接开始。</p> : <div className="table-scroll"><table><thead><tr><th>订单</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>{invoices.map(invoice => <tr key={invoice.id}><td><strong>{invoice.description}</strong><small>{new Date(invoice.createdAt).toLocaleString('zh-CN')}</small></td><td>{invoice.amount}<small>USDC</small></td><td><span className={`status ${invoice.status}`}>{invoice.status === 'paid' ? '已付款' : '待付款'}</span></td><td><Link href={`/pay/${invoice.id}`}>查看</Link><button className="text-button" onClick={() => copy(invoice.id)}>复制链接</button>{invoice.txHash && <a href={`https://explorer.arc.io/tx/${invoice.txHash}`} target="_blank" rel="noreferrer">链上凭证 ↗</a>}</td></tr>)}</tbody></table></div>}
      </section>
      <button className="text-button" onClick={async () => { try { await jsonRequest('/api/session', 'DELETE'); setLoggedIn(false); setInvoices([]); } catch (error) { setMessage(error instanceof Error ? error.message : '退出失败。'); } }}>退出登录</button>
    </>}
    {message && <div className="notice" role="status">{message}</div>}
    <footer><span>Arc Invoice / Merchant</span><Link href="/">返回首页</Link></footer>
  </main>;
}
