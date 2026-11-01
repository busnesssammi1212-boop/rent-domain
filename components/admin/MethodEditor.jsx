'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../Toast';
import { post } from './post';
import { METHOD_LABEL } from '@/lib/format';

export default function MethodEditor({ m }) {
  const toast = useToast(); const router = useRouter();
  const crypto = m.method === 'CRYPTO';
  const [f, setF] = useState({ is_enabled: m.is_enabled, instructions: m.instructions, receiving_number: m.receiving_number || '', wallet_address: m.wallet_address || '', networks: (m.networks || []).join(', '), tokens: (m.tokens || []).join(', '), min_confirmations: m.min_confirmations });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault(); setBusy(true);
    try { await post('/api/admin/settings', { method: m.method, ...f }); toast(`${METHOD_LABEL[m.method]} saved`); router.refresh(); } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="glass space-y-4 p-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold text-white">{METHOD_LABEL[m.method]}</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-violet-500" checked={f.is_enabled} onChange={(e) => setF({ ...f, is_enabled: e.target.checked })} />Enabled</label></div>
      <div><label className="label">Instructions shown to customers</label><textarea rows={3} className="input" value={f.instructions} onChange={set('instructions')} /></div>
      {!crypto && <div><label className="label">Receiving number</label><input className="input" value={f.receiving_number} onChange={set('receiving_number')} /></div>}
      {crypto && (<>
        <div><label className="label">Receiving wallet address</label><input className="input font-mono" value={f.wallet_address} onChange={set('wallet_address')} /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Networks (comma separated)</label><input className="input" value={f.networks} onChange={set('networks')} /></div>
          <div><label className="label">Tokens (comma separated)</label><input className="input" value={f.tokens} onChange={set('tokens')} /></div>
          <div><label className="label">Min confirmations</label><input type="number" min="0" className="input" value={f.min_confirmations} onChange={set('min_confirmations')} /></div>
        </div>
        <p className="text-xs text-slate-500">Public receiving address only. Never enter seed phrases or private keys.</p></>)}
      <button className="btn-primary" disabled={busy}>Save</button>
    </form>
  );
}
