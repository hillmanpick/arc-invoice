import { notFound } from 'next/navigation';
import { getInvoice } from '@/lib/db';
import { validId } from '@/lib/http';
import { Checkout } from './checkout';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = validId(id) ? getInvoice(id) : undefined;
  if (!invoice) notFound();
  return <Checkout initial={invoice} />;
}
