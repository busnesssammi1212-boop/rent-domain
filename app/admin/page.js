import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/supabase-admin';
import { formatPrice } from '@/lib/format';

export default async function Overview() {
  await requireAdmin();
  await db().rpc('expire_rentals');
  const count = async (table, fn) => { let q = db().from(table).select('id', { count: 'exact', head: true }); if (fn) q = fn(q); const { count: c } = await q; return c ?? 0; };
  const [listings, available, active, pending, approved, rejected, expired] = await Promise.all([
    count('domains'), count('domains', (q) => q.eq('is_active', true).eq('is_demo', false)),
    count('bookings', (q) => q.eq('status', 'ACTIVE')), count('payments', (q) => q.eq('status', 'PENDING_VERIFICATION')),
    count('payments', (q) => q.eq('status', 'APPROVED')), count('payments', (q) => q.eq('status', 'REJECTED')), count('bookings', (q) => q.eq('status', 'EXPIRED').not('rental_started_at', 'is', null)),
  ]);
  const { data: paid } = await db().from('payments').select('amount, currency').eq('status', 'APPROVED');
  const revenue = {};
  (paid || []).forEach((p) => { revenue[p.currency] = (revenue[p.currency] || 0) + Number(p.amount); });
  const cards = [['Total listings', listings], ['Available (verified, enabled)', available], ['Active rentals', active], ['Pending payments', pending], ['Approved payments', approved], ['Rejected payments', rejected], ['Expired rentals', expired]];
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([l, v]) => <div key={l} className="glass p-5"><p className="text-xs uppercase tracking-wider text-slate-400">{l}</p><p className="mt-2 text-3xl font-bold text-white">{v}</p></div>)}
        <div className="glass p-5"><p className="text-xs uppercase tracking-wider text-slate-400">Verified revenue</p>
          <p className="mt-2 text-xl font-bold text-white">{Object.keys(revenue).length ? Object.entries(revenue).map(([c, a]) => formatPrice(a, c)).join(' · ') : '0'}</p></div>
      </div>
    </div>
  );
}
