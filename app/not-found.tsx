import Link from 'next/link';
export default function NotFound() { return <main className="shell"><section className="card login-card"><h1>订单不存在</h1><p>请确认付款链接完整，或向收款方索取新链接。</p><Link href="/" className="button primary">返回首页</Link></section></main>; }
