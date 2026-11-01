'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../Toast';
import { post } from './post';

export default function PaymentActions({ paymentId }) {
  const toast = useToast(); const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(body, msg) {
    setBusy(true);
    try { await post('/api/admin/payments', { paymentId, ...body }); toast(msg); router.refresh(); } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-3 border-t border-white/10 pt-3">
      <label className="flex items-start gap-2 text-xs text-slate-300"><input type="checkbox" className="mt-0.5 accent-violet-500" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />I verified this transaction against the real provider or blockchain record (amount, receiver, status, not reused).</label>
      <button className="btn-primary" disabled={!confirmed || busy} onClick={() => run({ action: 'approve', confirmed }, 'Payment approved and rental activated')}>Approve &amp; activate</button>
      <div className="flex gap-2">
        <input className="input" placeholder="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Rejection reason" />
        <button className="btn-danger" disabled={busy || reason.trim().length < 3} onClick={() => run({ action: 'reject', reason }, 'Payment rejected')}>Reject</button>
      </div>
    </div>
  );
}
