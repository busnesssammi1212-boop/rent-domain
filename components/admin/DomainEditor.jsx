'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../Toast';
import { post } from './post';
import { formatDuration } from '@/lib/format';

const SECS = [1800, 2400, 3600, 86400, 604800, 2592000];

export default function DomainEditor({ domain }) {
  const toast = useToast(); const router = useRouter();
  const isNew = !domain;
  const byDur = Object.fromEntries((domain?.rental_plans || []).map((p) => [p.duration_seconds, p]));
  const [f, setF] = useState({
    id: domain?.id, domain_name: domain?.domain_name || '', description: domain?.description || '', category: domain?.category || 'General',
    is_active: domain?.is_active ?? true, verified: domain ? !domain.is_demo : false, confirmOwnership: false,
  });
  const [plans, setPlans] = useState(SECS.map((s) => ({ duration_seconds: s, price: byDur[s]?.price ?? 0, currency: byDur[s]?.currency ?? 'BDT', is_active: byDur[s]?.is_active ?? false })));
  const [busy, setBusy] = useState(false);
  const upd = (i, k, v) => setPlans(plans.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  async function save(e) {
    e.preventDefault(); setBusy(true);
    try { await post('/api/admin/domains', { ...f, plans }); toast('Domain saved'); router.refresh(); if (isNew) setF({ ...f, domain_name: '', description: '' }); } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Domain name</label><input className="input" required value={f.domain_name} onChange={(e) => setF({ ...f, domain_name: e.target.value })} /></div>
        <div><label className="label">Category</label><input className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
      </div>
      <div><label className="label">Description</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-violet-500" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />Listing enabled</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-violet-500" checked={f.verified} onChange={(e) => setF({ ...f, verified: e.target.checked })} />Verified (real domain I own)</label>
        {f.verified && <label className="flex items-center gap-2 text-amber-200"><input type="checkbox" className="accent-violet-500" checked={f.confirmOwnership} onChange={(e) => setF({ ...f, confirmOwnership: e.target.checked })} />I confirm I own or control this domain</label>}
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-slate-400"><tr><th className="py-1">Plan</th><th>Enabled</th><th>Price</th><th>Currency</th></tr></thead>
        <tbody>{plans.map((p, i) => (<tr key={p.duration_seconds} className="border-t border-white/5"><td className="py-2">{formatDuration(p.duration_seconds)}</td>
          <td><input type="checkbox" className="accent-violet-500" aria-label={`Enable ${formatDuration(p.duration_seconds)}`} checked={p.is_active} onChange={(e) => upd(i, 'is_active', e.target.checked)} /></td>
          <td><input type="number" min="0" step="0.01" className="input w-28 py-1.5" value={p.price} onChange={(e) => upd(i, 'price', e.target.value)} /></td>
          <td><input className="input w-24 py-1.5" value={p.currency} onChange={(e) => upd(i, 'currency', e.target.value.toUpperCase())} /></td></tr>))}</tbody></table></div>
      <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add domain' : 'Save changes'}</button>
    </form>
  );
}
