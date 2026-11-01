import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/supabase-admin';
import RevokeButton from '@/components/admin/RevokeButton';
import { Badge, statusTone } from '@/components/ui';

export default async function Rentals() {
  await requireAdmin();
  await db().rpc('expire_rentals');
  const { data } = await db().from('bookings').select('id, booking_reference, status, rental_started_at, rental_expires_at, customer_contact, domains(domain_name)')
    .in('status', ['ACTIVE', 'EXPIRED', 'REVOKED']).order('rental_started_at', { ascending: false }).limit(100);
  const { data: logs } = await db().from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
  const fmt = (t) => (t ? new Date(t).toLocaleString() : '-');
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Rentals</h1>
      <div className="glass overflow-x-auto p-2"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-slate-400"><tr><th className="p-3">Reference</th><th>Domain</th><th>Status</th><th>Started</th><th>Expires</th><th /></tr></thead>
        <tbody>{(data || []).map((b) => (<tr key={b.id} className="border-t border-white/5"><td className="p-3 font-mono">{b.booking_reference}</td><td>{b.domains.domain_name}</td><td><Badge tone={statusTone[b.status]}>{b.status}</Badge></td><td>{fmt(b.rental_started_at)}</td><td>{fmt(b.rental_expires_at)}</td><td>{b.status === 'ACTIVE' && <RevokeButton bookingId={b.id} />}</td></tr>))}</tbody></table>
        {!(data || []).length && <p className="p-4 text-sm text-slate-400">No rentals yet.</p>}</div>
      <div><h2 className="mb-3 font-semibold text-white">Audit log (latest 50)</h2>
        <div className="glass divide-y divide-white/5 text-xs">{(logs || []).map((l) => (<div key={l.id} className="flex flex-wrap gap-x-4 p-3"><span className="text-slate-500">{fmt(l.created_at)}</span><span className="font-semibold text-white">{l.action}</span><span className="text-slate-400">{l.resource_type} {l.resource_id}</span>{l.actor_id && <span className="text-slate-500">by {l.actor_id}</span>}</div>))}</div></div>
    </div>
  );
}
