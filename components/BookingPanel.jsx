'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QrBlock from './QrBlock';
import Countdown from './Countdown';
import { Badge, Skeleton, EmptyState, statusTone } from './ui';
import { useToast } from './Toast';
import { formatDuration, formatPrice, METHOD_LABEL } from '@/lib/format';

const KEY = (ref) => `rx-token-${ref}`;

export default function BookingPanel({ reference }) {
  const toast = useToast();
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cap, setCap] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ transactionReference: '', transactionHash: '', sender: '', note: '', network: '', tokenSymbol: '' });

  useEffect(() => {
    const m = window.location.hash.match(/t=([A-Za-z0-9_-]+)/);
    if (m) { localStorage.setItem(KEY(reference), m[1]); setToken(m[1]); history.replaceState(null, '', window.location.pathname); }
    else setToken(localStorage.getItem(KEY(reference)) || '');
  }, [reference]);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/bookings/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, token }) });
    const j = await res.json();
    if (!res.ok) { setError(j.error); return; }
    if (j.capabilityToken) setCap(j.capabilityToken);
    setError(null); setData(j);
  }, [reference, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!data || !['PENDING_PAYMENT', 'PENDING_VERIFICATION', 'ACTIVE'].includes(data.status)) return;
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [data, load]);

  async function pay(e) {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch('/api/bookings/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference, token, ...form }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast('Payment submitted. An administrator will verify it.');
      await load();
    } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  }

  if (token === null || (token && !data && !error)) return <div className="space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>;
  if (!token || error) return <EmptyState title="Booking not found" action={<Link href="/my-booking" className="btn-primary mt-6">Check a booking</Link>}>{error || 'Open your secret status link, or enter your reference and token.'}</EmptyState>;

  const ins = data.instructions;
  const crypto = data.payment.method === 'CRYPTO';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const copy = (t) => navigator.clipboard.writeText(t).then(() => toast('Copied'));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">Booking reference</p>
        <h1 className="font-mono text-3xl font-bold text-white">{data.reference}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2"><Badge tone={statusTone[data.status]}>{data.status.replaceAll('_', ' ')}</Badge><span className="text-sm text-slate-300">{data.domain} · {formatDuration(data.durationSeconds)}</span></div>
      </div>

      <div className="glass border-amber-400/30 p-4 text-sm text-amber-100">
        Save this page&apos;s link. Your secret status link is the only way to view this booking. To recover it later on this device, use <Link className="underline" href="/my-booking">My Booking</Link>.
        <button className="btn-ghost ml-2 mt-2 sm:mt-0" onClick={() => copy(`${window.location.origin}/booking/${reference}#t=${token}`)}>Copy secret link</button>
      </div>

      {data.status === 'PENDING_PAYMENT' && (
        <section className="glass space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Pay with {METHOD_LABEL[data.payment.method]}</h2>
            <Countdown until={data.paymentDeadline} serverNow={data.serverNow} label="to pay" />
          </div>
          <p className="text-3xl font-extrabold text-white">{formatPrice(data.payment.amount, data.payment.currency)} <span className="text-sm font-normal text-slate-400">exact amount due</span></p>
          {ins?.instructions && <p className="whitespace-pre-line text-sm text-slate-300">{ins.instructions}</p>}
          {!crypto && ins?.receiving_number && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4"><p className="label">Send to</p><p className="font-mono text-xl text-white">{ins.receiving_number}</p></div>
          )}
          {crypto && ins && (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                <p><span className="label">Networks</span>{(ins.networks || []).join(', ')}</p>
                <p><span className="label">Tokens</span>{(ins.tokens || []).join(', ')}</p>
                <p><span className="label">Wallet address</span><span className="break-all font-mono text-white">{ins.wallet_address}</span></p>
                <p className="text-xs text-slate-500">Required confirmations: {ins.min_confirmations}. Send only on a listed network, using a listed token.</p>
              </div>
              {ins.wallet_address && <QrBlock text={ins.wallet_address} />}
            </div>
          )}
          <form onSubmit={pay} className="space-y-4 border-t border-white/10 pt-5">
            <h3 className="font-semibold text-white">After paying, submit your transaction</h3>
            {crypto ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="net">Network</label><select id="net" required className="input" value={form.network} onChange={set('network')}><option value="">Select</option>{(ins?.networks || []).map((n) => <option key={n}>{n}</option>)}</select></div>
                  <div><label className="label" htmlFor="tok">Token</label><select id="tok" required className="input" value={form.tokenSymbol} onChange={set('tokenSymbol')}><option value="">Select</option>{(ins?.tokens || []).map((n) => <option key={n}>{n}</option>)}</select></div>
                </div>
                <div><label className="label" htmlFor="hash">Transaction hash</label><input id="hash" required className="input font-mono" value={form.transactionHash} onChange={set('transactionHash')} /></div>
              </>
            ) : (
              <>
                <div><label className="label" htmlFor="txn">Transaction ID</label><input id="txn" required className="input font-mono" value={form.transactionReference} onChange={set('transactionReference')} /></div>
                <div><label className="label" htmlFor="sender">Sender number or name</label><input id="sender" required className="input" value={form.sender} onChange={set('sender')} /></div>
              </>
            )}
            <div><label className="label" htmlFor="note">Payment reference (optional)</label><input id="note" className="input" maxLength={200} value={form.note} onChange={set('note')} /></div>
            <p className="text-xs text-slate-500">Submitting a transaction ID is not proof of payment. Your rental starts only after an administrator verifies it.</p>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Submitting…' : 'Submit payment'}</button>
          </form>
        </section>
      )}

      {data.status === 'PENDING_VERIFICATION' && <div className="glass p-6"><h2 className="text-xl font-semibold text-white">Payment under review</h2><p className="mt-2 text-sm text-slate-300">We received your transaction details. An administrator is checking them against the payment records. This page refreshes automatically.</p></div>}

      {data.status === 'ACTIVE' && (
        <div className="glass border-emerald-400/30 p-6">
          <h2 className="text-xl font-semibold text-white">Rental active</h2>
          <Countdown until={data.expiresAt} serverNow={data.serverNow} label="remaining (informational)" />
          <p className="mt-2 text-sm text-slate-400">Started {new Date(data.startedAt).toLocaleString()} · Ends {new Date(data.expiresAt).toLocaleString()}. The server enforces this end time.</p>
          {cap && (
            <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 text-sm"><p className="font-semibold text-amber-200">Rental access token (shown once)</p><p className="mt-1 break-all font-mono text-white">{cap}</p>
              <button className="btn-ghost mt-3" onClick={() => copy(cap)}>Copy token</button>
              <p className="mt-2 text-xs text-slate-400">Used for rental actions such as DNS management. DNS integration is in demo mode: no real DNS changes are made.</p></div>
          )}
        </div>
      )}

      {data.status === 'EXPIRED' && <EmptyState title="Rental ended">{data.startedAt ? 'This rental has expired and all rental access is revoked.' : 'The payment window lapsed before payment was submitted.'}</EmptyState>}
      {data.status === 'CANCELLED' && <div className="glass border-rose-400/30 p-6"><h2 className="text-xl font-semibold text-white">Payment rejected</h2><p className="mt-2 text-sm text-slate-300">{data.payment.rejectionReason || 'Your payment could not be verified.'}</p><p className="mt-2 text-sm text-slate-400">No rental was activated. Contact us if you believe this is a mistake.</p></div>}
      {data.status === 'REVOKED' && <EmptyState title="Rental revoked">An administrator revoked this rental. Contact us for details.</EmptyState>}
    </div>
  );
}
