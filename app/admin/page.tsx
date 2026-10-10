import { AdminPanel } from './panel';
import { isAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  return <AdminPanel authenticated={await isAdmin()} />;
}
