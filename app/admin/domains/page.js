import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/supabase-admin';
import DomainEditor from '@/components/admin/DomainEditor';
import { Badge } from '@/components/ui';

export default async function Domains() {
  await requireAdmin();
  const { data: domains } = await db().from('domains').select('*, rental_plans(*)').order('is_demo').order('domain_name');
  const { data: history } = await db().from('bookings').select('domain_id, booking_reference, status, rental_started_at, rental_expires_at').order('created_at', { ascending: false }).limit(300);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Domains</h1>
      <details className="glass p-5" open><summary className="cursor-pointer font-semibold text-white">Add a domain</summary><div className="mt-4"><DomainEditor /></div></details>
      {(domains || []).map((d) => (
        <details key={d.id} className="glass p-5">
          <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-medium text-white">{d.domain_name}
            {d.is_demo ? <Badge tone="violet">SAMPLE</Badge> : <Badge tone="green">VERIFIED</Badge>}{!d.is_active && <Badge tone="red">DISABLED</Badge>}</summary>
          <div className="mt-4 space-y-5">
            <DomainEditor domain={d} />
            <div><p className="label">Rental history</p>
              <ul className="space-y-1 text-xs text-slate-400">{(history || []).filter((h) => h.domain_id === d.id).slice(0, 10).map((h) => <li key={h.booking_reference}>{h.booking_reference} · {h.status}{h.rental_started_at && ` · ${new Date(h.rental_started_at).toLocaleString()} → ${new Date(h.rental_expires_at).toLocaleString()}`}</li>)}
                {!(history || []).some((h) => h.domain_id === d.id) && <li>No bookings yet.</li>}</ul></div>
          </div>
        </details>
      ))}
    </div>
  );
}
