'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from './Toast';
import { formatDuration, formatPrice, METHOD_LABEL } from '@/lib/format';

export default function RentForm({ domain, plans, methods }) {
  const toast = useToast();
  const [planId, setPlanId] = useState(plans[0]?.id);
  const [method, setMethod] = useState(methods[0]);
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const plan = plans.find((p) => p.id === planId);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domainId: domain.id, planId, contact, name, method, accepted }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      window.location.href = `/booking/${data.reference}#t=${data.token}`;
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass space-y-6 p-6">
      <fieldset>
        <legend className="label">Rental duration</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <label key={p.id} className={`cursor-pointer rounded-xl border p-4 transition ${planId === p.id ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 hover:border-white/30'}`}>
              <input type="radio" name="plan" className="sr-only" checked={planId === p.id} onChange={() => setPlanId(p.id)} />
              <span className="block font-medium text-white">{formatDuration(p.seconds)}</span>
              <span className="text-sm text-slate-400">{formatPrice(p.price, p.currency)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="contact">Email or phone</label>
        <input id="contact" className="input" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or +8801XXXXXXXXX" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="name">Display name (optional)</label>
        <input id="name" className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="method">Payment method</label>
        <select id="method" className="input" value={method} onChange={(e) => setMethod(e.target.value)}>{methods.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}</select>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">Amount due</span><span className="text-lg font-bold text-white">{plan && formatPrice(plan.price, plan.currency)}</span></div>
        <p className="mt-2 text-xs text-slate-500">The final price is calculated by our server when you book. You have 30 minutes to submit payment after booking.</p>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-violet-500" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
        <span>I accept the <Link href="/terms" className="text-violet-300 underline">Terms of Service</Link> and <Link href="/privacy" className="text-violet-300 underline">Privacy Policy</Link>.</span>
      </label>
      <button className="btn-primary w-full" disabled={busy || !accepted || !planId}>{busy ? 'Creating booking…' : 'Continue to payment'}</button>
    </form>
  );
}
