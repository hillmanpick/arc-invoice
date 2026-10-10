import Link from 'next/link';
export default function Home() {
  return <main className="shell">
    <nav><Link className="brand" href="/">◈ Arc Invoice</Link><Link className="nav-link" href="/admin">商户工作台 ↗</Link></nav>
    <section className="hero">
      <div className="eyebrow"><span className="dot" /> USDC PAYMENTS ON ARC</div>
      <h1>一条付款链接。<br /><span>一笔清晰的账。</span></h1>
      <p className="lead">创建 USDC 收款订单，分享链接，让链上交易成为到账凭证。</p>
      <div className="actions"><Link href="/admin" className="button primary">创建收款订单 <span>→</span></Link><a className="button secondary" href="https://explorer.arc.io" target="_blank" rel="noreferrer">查看 Arc 浏览器 ↗</a></div>
      <div className="hero-note">资金直接进入收款钱包 · 每笔付款与订单对应</div>
    </section>
    <section className="steps">
      <article><span className="step-number">01</span><h2>创建</h2><p>填写金额和说明，生成专属付款链接。</p></article>
      <article><span className="step-number">02</span><h2>支付</h2><p>付款人在钱包里核对金额、收款地址并确认。</p></article>
      <article><span className="step-number">03</span><h2>对账</h2><p>核验链上到账，保留可公开查询的交易凭证。</p></article>
    </section>
    <footer><span>Arc Invoice / 2026</span><span>收款使用 Arc 主网 USDC，交易需支付网络手续费。</span></footer>
  </main>;
}
