import Link from 'next/link';
import { getAdmin } from '@/lib/admin-auth';
import SignOut from '@/components/admin/SignOut';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  const admin = await getAdmin(); // null on /admin/login or for non-admins; pages call requireAdmin() themselves
  return (
    <div className="container-x py-8">
      {admin && (
        <nav className="glass mb-8 flex flex-wrap items-center gap-2 p-3 text-sm" aria-label="Admin">
          {[['/admin', 'Overview'], ['/admin/domains', 'Domains'], ['/admin/payments', 'Payments'], ['/admin/rentals', 'Rentals'], ['/admin/settings', 'Payment methods']].map(([h, l]) => (
            <Link key={h} href={h} className="rounded-lg px-3 py-1.5 hover:bg-white/10">{l}</Link>
          ))}
          <span className="ml-auto text-xs text-slate-500">{admin.email}</span><SignOut />
        </nav>
      )}
      {children}
    </div>
  );
}
