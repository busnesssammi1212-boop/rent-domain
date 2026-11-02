'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/Toast';

export default function AdminLogin() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { toast(error.message, 'error'); setBusy(false); return; }
    window.location.href = '/admin';
  }

  return (
    <div className="container-x max-w-sm py-20">
      <h1 className="text-2xl font-bold text-white">Administrator sign in</h1>
      <form onSubmit={submit} className="glass mt-6 space-y-4 p-6">
        <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
        <div><label className="label" htmlFor="p">Password</label><input id="p" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
