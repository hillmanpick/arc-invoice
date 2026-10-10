'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createWalletClient, custom, publicActions, parseUnits, parseGwei, type EIP1193Provider, type Hash, type Address } from 'viem';
import { arc, invoiceData } from '@/lib/arc';
import type { Invoice } from '@/lib/models';
declare global { interface Window { ethereum?: EIP1193Provider } }
interface WalletOption { provider: EIP1193Provider; info: { uuid: string; name: string } }
export function Checkout({ initial }: { initial: Invoice }) {
  const [invoice, setInvoice] = useState(initial);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [account, setAccount] = useState<Address | null>(null);
  const [hash, setHash] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const storageKey = `arc-invoice:${initial.id}:hash`;
  useEffect(() => {
    try { setHash(localStorage.getItem(storageKey) || ''); } catch { /* Storage may be disabled. */ }
    const discover = (event: Event) => {
      const wallet = (event as CustomEvent<WalletOption>).detail;
      if (wallet?.provider && wallet.info?.uuid) setWallets(previous => previous.some(w => w.info.uuid === wallet.info.uuid) ? previous : [...previous, wallet]);
    };
    window.addEventListener('eip6963:announceProvider', discover);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return () => window.removeEventListener('eip6963:announceProvider', discover);
  }, [storageKey]);
  useEffect(() => {
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash) || invoice.status === 'paid') return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (cancelled) return;
      attempts++;
      try {
        const response = await fetch(`/api/invoices/${invoice.id}/verify`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }),
        });
        const result = await response.json();
        if (cancelled) return;
        if (response.ok) {
          setInvoice(result.invoice); setMessage('到账已确认。');
          try { localStorage.removeItem(storageKey); } catch { /* Recovery is optional. */ }
          return;
        }
        if (response.status !== 429 && response.status !== 503) { setMessage(result.error || '核验失败。'); return; }
        if (attempts >= 12) { setMessage(result.error || '暂未确认到账。请保留哈希，稍后手动核验。'); return; }
      } catch {
        if (attempts >= 12) { if (!cancelled) setMessage('暂时无法核验。请保留哈希，稍后重试。'); return; }
      }
      if (!cancelled) timer = setTimeout(poll, 5000);
    }
    timer = setTimeout(poll, 3000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [hash, invoice.id, invoice.status, storageKey]);
  function provider() {
    if (wallets.length > 1 && !selectedWallet) throw new Error('请选择要使用的钱包。');
    const candidate = wallets.find(w => w.info.uuid === selectedWallet)?.provider || (wallets.length === 1 ? wallets[0].provider : window.ethereum);
    if (!candidate) throw new Error('未检测到钱包。请使用安装了 MetaMask 或 Rabby 的浏览器打开。');
    return candidate;
  }
  async function connect() {
    setBusy(true); setMessage('');
    try {
      const wallet = createWalletClient({ transport: custom(provider()) });
      const [address] = await wallet.requestAddresses();
      if (!address) throw new Error('钱包没有提供可用地址。');
      setAccount(address); setMessage('钱包已连接。请核对订单后付款。');
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  }
  function showError(error: unknown) {
    const e = error as { code?: number; shortMessage?: string; message?: string };
    setMessage(e.code === 4001 ? '你取消了钱包操作。' : e.shortMessage || e.message || '操作失败，请重试。');
  }
  async function verify(transactionHash = hash) {
    setBusy(true); setMessage('正在核验链上付款…');
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash: transactionHash.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '核验失败。');
      setInvoice(result.invoice); setMessage('到账已确认。');
      try { localStorage.removeItem(storageKey); } catch { /* Optional recovery storage. */ }
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  }
  async function pay() {
    if (hash.trim()) { setMessage('已有交易哈希，请先核验原交易，避免重复付款。'); return; }
    setBusy(true); setMessage('请在钱包里确认网络和交易。');
    try {
      const source = provider();
      const wallet = createWalletClient({ transport: custom(source) });
      const [address] = await wallet.requestAddresses();
      if (!address) throw new Error('钱包没有提供可用地址。');
      setAccount(address);
      if (await wallet.getChainId() !== arc.id) {
        try { await wallet.switchChain({ id: arc.id }); }
        catch (error) {
          const e = error as { code?: number; cause?: { code?: number } };
          if (e.code !== 4902 && e.cause?.code !== 4902) throw error;
          await wallet.addChain({ chain: arc }); await wallet.switchChain({ id: arc.id });
        }
      }
      const fees = await wallet.extend(publicActions).estimateFeesPerGas({ chain: arc });
      const maxFeePerGas = fees.maxFeePerGas < parseGwei('20') ? parseGwei('20') : fees.maxFeePerGas;
      const transactionHash = await wallet.sendTransaction({
        chain: arc, account: address, to: invoice.recipient as Address,
        value: parseUnits(invoice.amount, 18), data: invoiceData(invoice.id),
        maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
      setHash(transactionHash);
      try { localStorage.setItem(storageKey, transactionHash); } catch { /* Always keep hash in the UI. */ }
      setMessage('交易已提交。请保留交易哈希，然后核验到账；不要重复付款。');
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  }
  return <main className="shell checkout-shell">
    <nav><Link href="/" className="brand">◈ Arc Invoice</Link><span className="network-badge">Arc 主网</span></nav>
    <section className="checkout card">
      <div className="eyebrow">PAYMENT REQUEST</div><h1>{invoice.description}</h1>
      <div className="payment-amount">{invoice.amount}<span>USDC</span></div>
      <span className={`status ${invoice.status}`}>{invoice.status === 'paid' ? '已付款 · 链上确认' : '等待付款'}</span>
      <dl><dt>收款地址</dt><dd className="mono">{invoice.recipient}</dd><dt>订单编号</dt><dd className="mono">{invoice.id}</dd><dt>网络</dt><dd>Arc · Chain ID 5042</dd></dl>
      {invoice.status === 'pending' ? <>
        {wallets.length > 1 && <><label htmlFor="wallet">选择钱包</label><select id="wallet" value={selectedWallet} onChange={e => { setSelectedWallet(e.target.value); setAccount(null); }}><option value="">请选择</option>{wallets.map(w => <option key={w.info.uuid} value={w.info.uuid}>{w.info.name}</option>)}</select></>}
        {account && <p className="hint mono">连接的钱包：{account}</p>}
        <div className="actions"><button className="button secondary" disabled={busy} onClick={connect}>连接钱包</button><button className="button primary" disabled={busy || Boolean(hash.trim())} onClick={pay}>{busy ? '处理中…' : `支付 ${invoice.amount} USDC →`}</button></div>
        <p className="hint">使用钱包签名付款，网络手续费另计。请在钱包确认前核对地址与金额。</p>
        <div className="verification"><label htmlFor="hash">已提交交易？核验到账</label><input id="hash" placeholder="0x… 交易哈希" value={hash} onChange={e => setHash(e.target.value)} autoComplete="off" /><button className="button secondary" disabled={busy || !hash.trim()} onClick={() => verify()}>核验这笔交易</button>{/^0x[0-9a-fA-F]{64}$/.test(hash) && <a className="transaction-link" href={`https://explorer.arc.io/tx/${hash as Hash}`} target="_blank" rel="noreferrer">查看交易状态 ↗</a>}</div>
      </> : <div className="receipt"><h2>付款完成</h2><p>付款时间：{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString('zh-CN') : ''}</p><a className="button primary" href={`https://explorer.arc.io/tx/${invoice.txHash}`} target="_blank" rel="noreferrer">查看链上凭证 ↗</a></div>}
      {message && <div className="notice" role="status">{message}</div>}
    </section>
    <footer><span>Arc Invoice / Checkout</span><span>资金由钱包直接支付给收款方。</span></footer>
  </main>;
}
