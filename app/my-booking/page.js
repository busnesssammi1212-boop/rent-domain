'use client';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function MyBooking() {
  const toast = useToast();
  const [ref, setRef] = useState('');
  const [tok, setTok] = useState('');
  function go(e) {
    e.preventDefault();
    let r = ref.trim().toUpperCase(); let t = tok.trim();
    const link = ref.trim().match(/\/booking\/(RX-[A-Z0-9]{5}-[A-Z0-9]{5})#t=([A-Za-z0-9_-]+)/i);
    if (link) { r = link[1].toUpperCase(); t = link[2]; }
    if (!/^RX-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(r)) return toast('Enter a valid booking reference (RX-XXXXX-XXXXX) or paste your full status link.', 'error');
    if (t) window.location.href = `/booking/${r}#t=${t}`;
    else if (localStorage.getItem(`rx-token-${r}`)) window.location.href = `/booking/${r}`;
    else toast('Enter the secret token from your status link. We cannot show a booking without it.', 'error');
  }
  return (
    <div className="container-x max-w-xl py-12">
      <h1 className="text-3xl font-bold text-white">My Booking</h1>
      <p className="mt-2 text-sm text-slate-400">No account needed. Paste your full secret status link, or enter your reference and token.</p>
      <form onSubmit={go} className="glass mt-8 space-y-5 p-6">
        <div><label className="label" htmlFor="r">Booking reference or full link</label><input id="r" className="input font-mono" required value={ref} onChange={(e) => setRef(e.target.value)} placeholder="RX-XXXXX-XXXXX" /></div>
        <div><label className="label" htmlFor="t">Secret token (optional if you pasted the link)</label><input id="t" className="input font-mono" value={tok} onChange={(e) => setTok(e.target.value)} autoComplete="off" /></div>
        <button className="btn-primary w-full">Check status</button>
      </form>
    </div>
  );
}
