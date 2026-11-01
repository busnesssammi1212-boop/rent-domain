import Link from 'next/link';
import { notFound } from 'next/navigation';
import RentForm from '@/components/RentForm';
import { EmptyState } from '@/components/ui';
import { getDomain, enabledMethods } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rental Checkout' };

export default async function Rent({ params }) {
  const d = await getDomain(decodeURIComponent(params.name));
  if (!d) notFound();
  const methods = await enabledMethods();
  const blocked = d.is_demo ? 'This is a SAMPLE listing. Payment is disabled.' : d.status !== 'AVAILABLE' ? 'This domain is not available right now.' : !methods.length ? 'No payment method is configured yet. Please check back soon.' : null;
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-bold text-white">Rent <span className="gradient-text break-all">{d.domain_name}</span></h1>
      <div className="mt-8">
        {blocked
          ? <EmptyState title="Checkout unavailable" action={<Link href="/explore" className="btn-primary mt-6">Explore domains</Link>}>{blocked}</EmptyState>
          : <RentForm domain={{ id: d.id, name: d.domain_name }} plans={d.plans.map((p) => ({ id: p.id, seconds: p.duration_seconds, price: p.price, currency: p.currency }))} methods={methods} />}
      </div>
    </div>
  );
}
