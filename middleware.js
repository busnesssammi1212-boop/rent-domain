import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Refreshes the admin session cookie and keeps anonymous visitors out of /admin pages.
// Real authorization (admin allowlist) is enforced again on the server in every page and API route.
export async function middleware(req) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user && req.nextUrl.pathname !== '/admin/login') return NextResponse.redirect(new URL('/admin/login', req.url));
  return res;
}
export const config = { matcher: ['/admin/:path*'] };
