import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './supabase-admin';

export function authClient() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}

// Returns the Supabase user only if verified by Supabase Auth AND present in admin_users.
export async function getAdmin() {
  const { data: { user } } = await authClient().auth.getUser();
  if (!user) return null;
  const { data } = await db().from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  return data ? user : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login?denied=1');
  return admin;
}
