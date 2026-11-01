import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/supabase-admin';
import MethodEditor from '@/components/admin/MethodEditor';

export default async function Settings() {
  await requireAdmin();
  const { data } = await db().from('payment_methods').select('*').order('method');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Payment methods</h1>
      <p className="text-sm text-slate-400">A method must be enabled with receiving details before customers can book. Rental plans are enabled per domain under Domains.</p>
      {(data || []).map((m) => <MethodEditor key={m.method} m={m} />)}
    </div>
  );
}
