'use client';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { translate, type Locale } from '@/lib/translations';

interface I18nState {
  locale: Locale;
  dateLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}
const I18nContext = createContext<I18nState | null>(null);
export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale);
  const setLocale = useCallback((next: Locale) => {
    updateLocale(next);
    document.cookie = `arc_invoice_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }, []);
  const t = useCallback((key: string, values?: Record<string, string | number>) => translate(locale, key, values), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.title = locale === 'zh' ? 'Arc Invoice · USDC 收款与对账' : 'Arc Invoice · USDC payments & reconciliation';
  }, [locale]);
  const value = useMemo(() => ({ locale, dateLocale: locale === 'zh' ? 'zh-CN' : 'en-US', setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('I18nProvider is required.');
  return context;
}
export function LanguageSwitch() {
  const { locale, setLocale } = useI18n();
  return <div className="language-switch" role="group" aria-label={locale === 'en' ? 'Language' : '语言'}>
    <button type="button" lang="en" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
    <button type="button" lang="zh-CN" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>中文</button>
  </div>;
}
