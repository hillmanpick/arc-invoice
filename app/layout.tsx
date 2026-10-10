import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Arc Invoice · USDC 收款与对账',
  description: '在 Arc 上创建 USDC 付款链接，以链上交易核验订单。',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
