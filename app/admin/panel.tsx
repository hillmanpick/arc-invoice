'use client';
import { useI18n, LanguageSwitch } from '@/app/components/i18n';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import type { AddressHistory, Invoice } from '@/lib/models';
import { Brand } from '../components/brand';

async function jsonRequest(path: string, method: string, body?: unknown) {
  const response = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '请求失败。');
  return result;
}
export function AdminPanel({ authenticated }: { authenticated: boolean }) {
  const { t, dateLocale } = useI18n();
  const [loggedIn, setLoggedIn] = useState(authenticated);
  const [token, setToken] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [recipient, setRecipient] = useState('');
  const [expectedPayer, setExpectedPayer] = useState('');
  const [history, setHistory] = useState<{ recipients: AddressHistory[]; payers: AddressHistory[] }>({ recipients: [], payers: [] });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Invoice | null>(null);
  async function refresh() {
    try {
      const result = await jsonRequest('/api/invoices', 'GET');
      setInvoices(result.invoices); setHistory(result.addressHistory);
      setRecipient(previous => previous || result.defaultRecipient || '');
    }
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
      const { invoice } = await jsonRequest('/api/invoices', 'POST', { description, amount, recipient, expectedPayer });
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
    <nav><Brand /><div className="nav-actions"><LanguageSwitch /><Link href="/" className="nav-link">{t("返回首页")}</Link><span className="network-badge"><span className="dot" />{t("Arc 主网")}</span></div></nav>
    <header className="page-heading"><div className="eyebrow">{t("MERCHANT WORKSPACE")}</div><h1>{t("收款工作台")}</h1><p>{t("创建订单、分享付款链接，查看到账凭证。")}</p></header>
    {!loggedIn ? <section className="card login-card"><h2>{t("商户登录")}</h2><p className="muted">{t("使用部署时设置的管理口令。")}</p><form onSubmit={signIn}><label htmlFor="token">{t("管理口令")}</label><input id="token" type="password" autoComplete="current-password" required value={token} onChange={e => setToken(e.target.value)} /><button className="button primary" disabled={busy}>{busy ? t("登录中…") : t("进入工作台 →")}</button></form></section> : <>
      <section className="metrics" aria-label={t("最近200笔订单统计")}><article><span>{t("最近订单")}</span><strong>{invoices.length}<small>{t("笔")}</small></strong><p>{t("最多展示最近 200 笔")}</p></article><article><span>{t("到账确认")}</span><strong>{invoices.filter(i => i.status === 'paid').length}<small>{t("笔")}</small></strong><p>{t("已通过链上核验")}</p></article><article><span>{t("等待付款")}</span><strong>{invoices.filter(i => i.status === 'pending').length}<small>{t("笔")}</small></strong><p>{t("分享链接，等待钱包支付")}</p></article></section>
      <div className="workspace">
        <section className="card"><div className="eyebrow">{t("NEW PAYMENT LINK")}</div><h2>{t("新建收款订单")}</h2><form onSubmit={create}>
          <label htmlFor="description">{t("订单说明")}</label><input id="description" maxLength={120} required placeholder={t("例如：Arc Invoice 演示订单")} value={description} onChange={e => setDescription(e.target.value)} />
          <label htmlFor="amount">{t("金额 / USDC")}</label><input id="amount" inputMode="decimal" required value={amount} onChange={e => setAmount(e.target.value)} />
          <label htmlFor="recipient">{t("收款地址")}</label><input id="recipient" className="mono" required autoComplete="off" spellCheck={false} placeholder="0x…" value={recipient} onChange={e => setRecipient(e.target.value)} />
          {history.recipients.length > 0 && <select aria-label={t("选择历史收款地址")} value="" onChange={e => setRecipient(e.target.value)}><option value="">{t("选择历史收款地址")}</option>{history.recipients.map(item => <option key={item.address} value={item.address}>{item.address}</option>)}</select>}
          <label htmlFor="expectedPayer">{t("指定付款地址（选填）")}</label><input id="expectedPayer" className="mono" autoComplete="off" spellCheck={false} placeholder={t("留空则允许任意钱包付款")} value={expectedPayer} onChange={e => setExpectedPayer(e.target.value)} />
          {history.payers.length > 0 && <select aria-label={t("选择历史付款地址")} value="" onChange={e => setExpectedPayer(e.target.value)}><option value="">{t("选择历史付款地址")}</option>{history.payers.map(item => <option key={item.address} value={item.address}>{item.address}</option>)}</select>}
          <p className="hint">{t("指定付款地址后，只接受该钱包的链上付款；付款仍需钱包持有人签名。")}</p>
          <p className="hint">{t("首次演示建议使用 0.01 USDC，另外准备网络手续费。")}</p>
          <button className="button primary" disabled={busy}>{busy ? t("正在创建…") : t("生成付款链接 →")}</button>
        </form></section>
        <section className="card accent-card"><div className="eyebrow">{t("DIRECT SETTLEMENT")}</div><h2>{t("收款直接进入")}<br />{t("你的钱包。")}</h2><p>{t("每笔新订单可自选收款地址。创建后地址和金额锁定，系统核验实际链上付款。")}</p>
          <div className="workspace-flow"><span>{t("付款链接")}</span><b>→</b><span>{t("钱包支付")}</span><b>→</b><span>{t("链上凭证")}</span></div>
          {newInvoice && <div className="created"><strong>{t("订单已创建")}</strong><p>{newInvoice.description} · {newInvoice.amount} USDC</p><div className="actions"><button className="button secondary" onClick={() => copy(newInvoice.id)}>{t("复制链接")}</button><Link className="button secondary" href={`/pay/${newInvoice.id}`}>{t("打开付款页 ↗")}</Link></div></div>}
        </section>
      </div>
      <section className="card ledger"><h2>{t("地址历史")}</h2><p className="hint">{t("展示最近使用的 100 个不同地址；收款历史按创建订单统计，付款历史仅统计已核验到账。")}</p><div className="address-columns">{(['recipients', 'payers'] as const).map(kind => <div key={kind}><h3>{t(kind === 'recipients' ? '历史收款地址' : '历史付款地址')}</h3>{!history[kind].length ? <p className="hint">{t("暂无地址记录")}</p> : <ul className="address-list">{history[kind].map(item => <li key={item.address}><code>{item.address}</code><small>{t("{count} 笔订单", { count: item.count })} · {new Date(item.lastUsedAt).toLocaleString(dateLocale)}</small><button type="button" className="text-button" onClick={() => { if (kind === 'recipients') setRecipient(item.address); else setExpectedPayer(item.address); document.getElementById(kind === 'recipients' ? 'recipient' : 'expectedPayer')?.focus(); }}>{t("使用此地址")}</button></li>)}</ul>}</div>)}</div></section>
      <section className="card ledger"><div className="section-heading"><h2>{t("最近订单")}</h2><button className="text-button" onClick={refresh}>{t("刷新 ↻")}</button></div>
        {!invoices.length ? <p className="empty">{t("还没有订单。从创建第一条付款链接开始。")}</p> : <div className="table-scroll"><table><thead><tr><th>{t("订单")}</th><th>{t("收付款地址")}</th><th>{t("金额")}</th><th>{t("状态")}</th><th>{t("操作")}</th></tr></thead><tbody>{invoices.map(invoice => <tr key={invoice.id}><td><strong>{invoice.description}</strong><small>{new Date(invoice.createdAt).toLocaleString(dateLocale)}</small></td><td className="ledger-address"><small>{t("收款地址")}</small><code>{invoice.recipient}</code><small>{t("指定付款地址")}</small><code>{invoice.expectedPayer || t("任意钱包")}</code><small>{t("实际付款地址")}</small><code>{invoice.payer || '—'}</code></td><td>{invoice.amount}<small>USDC</small></td><td><span className={`status ${invoice.status}`}>{invoice.status === 'paid' ? t("已付款") : t("待付款")}</span></td><td><Link href={`/pay/${invoice.id}`}>{t("查看")}</Link><button className="text-button" onClick={() => copy(invoice.id)}>{t("复制链接")}</button>{invoice.txHash && <a href={`https://explorer.arc.io/tx/${invoice.txHash}`} target="_blank" rel="noreferrer">{t("链上凭证 ↗")}</a>}</td></tr>)}</tbody></table></div>}
      </section>
      <button className="text-button" onClick={async () => { try { await jsonRequest('/api/session', 'DELETE'); setLoggedIn(false); setInvoices([]); setHistory({ recipients: [], payers: [] }); setRecipient(''); setExpectedPayer(''); setNewInvoice(null); } catch (error) { setMessage(error instanceof Error ? error.message : '退出失败。'); } }}>{t("退出登录")}</button>
    </>}
    {message && <div className="notice" role="status">{t(message)}</div>}
    <footer><span>Arc Invoice / Merchant</span><Link href="/">{t("返回首页")}</Link></footer>
  </main>;
}
