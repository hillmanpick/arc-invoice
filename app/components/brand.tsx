import Link from 'next/link';
export function Brand() {
  return <Link href="/" className="brand" aria-label="Arc Invoice 首页"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M7 23 16 7l9 16M11 18h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span>arc<span className="brand-light">invoice</span><span className="brand-period">.</span></span></Link>;
}
