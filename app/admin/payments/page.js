import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/supabase-admin';
import PaymentActions from '@/components/admin/PaymentActions';
import { Badge, EmptyState, statusTone } from '@/components/ui';
import { formatPrice, formatDuration, METHOD_LABEL } from '@/lib/format';

export default async function Payments() {
  await requireAdmin();
  await db().rpc('expire_rentals');
  const { data } = await db().from('payments')
    .select('*, bookings(booking_reference, customer_contact, customer_name, duration_seconds, domains(domain_name))')
    .neq('status', 'PENDING_PAYMENT').order('created_at', { ascending: false }).limit(100);
  const pending = (data || []).filter((p) => p.status === 'PENDING_VERIFICATION');
  const done = (data || []).filter((p) => p.status !== 'PENDING_VERIFICATION');
  const Row = ({ p, actions }) => (
    <div className="glass space-y-2 p-5 text-sm">
      <div className="flex flex-wrap items-center gap-2"><span className="font-mono font-semibold text-white">{p.bookings.booking_reference}</span><Badge tone={statusTone[p.status]}>{p.status.replaceAll('_', ' ')}</Badge><Badge>{METHOD_LABEL[p.method]}</Badge></div>
      <p>{p.bookings.domains.domain_name} · {formatDuration(p.bookings.duration_seconds)} · <b className="text-white">{formatPrice(p.amount, p.currency)}</b></p>
      <p className="text-slate-400">Customer: {p.bookings.customer_contact}{p.bookings.customer_name && ` (${p.bookings.customer_name})`}</p>
      {p.transaction_reference && <p>Transaction ID: <span className="font-mono text-white">{p.transaction_reference}</span> · Sender: {p.sender_info}</p>}
      {p.transaction_hash && <p className="break-all">Hash: <span className="font-mono text-white">{p.transaction_hash}</span> · {p.crypto_network} / {p.crypto_token}</p>}
      {p.payment_note && <p className="text-slate-400">Note: {p.payment_note}</p>}
      {p.rejection_reason && <p className="text-rose-300">Rejected: {p.rejection_reason}</p>}
      {p.verified_at && <p className="text-xs text-slate-500">Reviewed by {p.verified_by} at {new Date(p.verified_at).toLocaleString()}</p>}
      {actions}
    </div>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Payments</h1>
      <h2 className="font-semibold text-white">Pending verification ({pending.length})</h2>
      {pending.length === 0 ? <EmptyState title="Nothing to review">New payment submissions will appear here.</EmptyState> : pending.map((p) => <Row key={p.id} p={p} actions={<PaymentActions paymentId={p.id} />} />)}
      <h2 className="pt-4 font-semibold text-white">Reviewed</h2>
      <div className="space-y-4">{done.map((p) => <Row key={p.id} p={p} />)}</div>
    </div>
  );
}
