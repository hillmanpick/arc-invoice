'use client';
import { useI18n, LanguageSwitch } from '@/app/components/i18n';
import Link from 'next/link';
export default function NotFound() { const { t } = useI18n(); return <main className="shell"><nav><Link href="/">Arc Invoice</Link><LanguageSwitch /></nav><section className="card login-card"><h1>{t("订单不存在")}</h1><p>{t("请确认付款链接完整，或向收款方索取新链接。")}</p><Link href="/" className="button primary">{t("返回首页")}</Link></section></main>; }
