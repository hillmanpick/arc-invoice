import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { I18nProvider } from './components/i18n';
import './globals.css';
export const metadata: Metadata = {
  title: 'Arc Invoice · USDC payments & reconciliation',
  description: 'Create USDC payment links on Arc and reconcile invoices with onchain receipts.',
  robots: { index: false, follow: false },
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await cookies()).get('arc_invoice_locale')?.value === 'zh' ? 'zh' : 'en';
  return <html lang={locale === 'zh' ? 'zh-CN' : 'en'}><body><I18nProvider initialLocale={locale}>{children}</I18nProvider></body></html>;
}
