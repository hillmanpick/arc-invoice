import Link from 'next/link';
import { Brand } from './components/brand';
export default function Home() {
  return <main className="shell">
    <nav><Brand /><div className="nav-actions"><a className="nav-link" href="https://github.com/hillmanpick/arc-invoice" target="_blank" rel="noreferrer">GitHub ↗</a><Link className="button nav-button primary" href="/admin">商户工作台 <span>↗</span></Link></div></nav>
    <section className="hero-grid">
      <div className="hero"><div className="eyebrow"><span className="dot" /> BUILT FOR ARC · PAID IN USDC</div><h1>让每一笔收款，<br /><span>都有据可查。</span></h1><p className="lead">从一条付款链接，到一张链上凭证。<br />用 USDC 收款，把订单与到账清楚地连在一起。</p><div className="actions"><Link href="/admin" className="button primary">创建第一笔订单 <span>→</span></Link><a className="button secondary" href="https://explorer.arc.io" target="_blank" rel="noreferrer">探索 Arc ↗</a></div><div className="hero-note"><span>↗ 钱包直接收款</span><span>✓ 链上核验</span><span>◎ 公开源码</span></div></div>
      <div className="hero-art" aria-label="付款链接与链上凭证的示意图，不代表真实交易"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><span className="art-label">A SIMPLE FLOW. A CLEAR RECORD.</span><div className="preview-invoice"><div className="preview-top"><span className="mini-mark">↗</span><span>PAYMENT LINK</span><span className="example-label">功能示意</span></div><p className="preview-description">设计服务 · 收款订单</p><div className="preview-amount">25.00 <span>USDC</span></div><div className="preview-meta"><span>结算网络</span><strong><i className="dot" /> Arc</strong></div><div className="preview-pay">钱包确认付款 <span>→</span></div></div><div className="preview-receipt"><span className="receipt-icon">✓</span><div><strong>到账，已确认</strong><small>订单与交易逐笔关联 · 功能示意</small></div><span className="receipt-arrow">↗</span></div><span className="art-bottom">PAYMENT → ONCHAIN PROOF</span></div>
    </section>
    <div className="feature-strip"><span className="feature-label">DESIGNED TO BE SIMPLE</span><span>无需托管资金</span><span>每笔订单独立核验</span><span>交易凭证随时可查</span></div>
    <div className="section-title"><div className="eyebrow">FROM LINK TO RECEIPT</div><h2>三步，把收款变成清晰的记录。</h2></div>
    <section className="steps">
      <article><div className="step-top"><span className="step-icon">↗</span><span className="step-number">01 / CREATE</span></div><h2>分享一条付款链接</h2><p>设定金额与订单说明。收款地址固定，付款信息一目了然。</p></article>
      <article><div className="step-top"><span className="step-icon">◎</span><span className="step-number">02 / PAY</span></div><h2>在自己的钱包里支付</h2><p>核对金额与地址，在 Arc 上确认 USDC 付款。资金直接到达收款钱包。</p></article>
      <article><div className="step-top"><span className="step-icon">✓</span><span className="step-number">03 / VERIFY</span></div><h2>为到账保留一张凭证</h2><p>核验成功交易，更新订单状态。每一笔记录都能查看链上凭证。</p></article>
    </section>
    <footer><span>Arc Invoice / 2026</span><span>收款使用 Arc 主网 USDC，交易需支付网络手续费。</span></footer>
  </main>;
}
