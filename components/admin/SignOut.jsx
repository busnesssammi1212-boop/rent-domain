'use client';
import { createBrowserClient } from '@supabase/ssr';
export default function SignOut() {
  return <button className="btn-ghost py-1.5" onClick={async () => { await createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.signOut(); window.location.href = '/admin/login'; }}>Sign out</button>;
}
