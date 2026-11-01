import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DomainVisual } from '@/components/DomainCard';
import { Badge, statusTone } from '@/components/ui';
import { getDomain } from '@/lib/data';
import { formatDuration, formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }) { return { title: params.name }; }

export default async function DomainPage({ params }) {
  const d = await getDomain(decodeURIComponent(params.name));
  if (!d) notFound();
  const canRent = !d.is_demo && d.status === 'AVAILABLE';
  return (
    <div className="container-x grid gap-8 py-12 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <DomainVisual name={d.domain_name} className="h-64" />
        <h1 className="mt-6 break-all text-3xl font-bold text-white">{d.domain_name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {d.is_demo && <Badge tone="violet">SAMPLE</Badge>}
          <Badge tone={d.is_demo ? 'slate' : statusTone[d.status]}>{d.is_demo ? 'Demo only' : d.status === 'AVAILABLE' ? 'Available' : d.status === 'RENTED' ? 'Rented' : 'Unavailable'}</Badge>
          <Badge>{d.category}</Badge>
        </div>
        <p className="mt-4 text-slate-300">{d.description}</p>
        {d.is_demo && (
          <p className="glass mt-6 border-violet-400/30 p-4 text-sm text-violet-200">This is a demonstration listing. It is not registered or owned by Rentex, is not available to rent, and payment is disabled.</p>
        )}
      </div>
      <aside className="glass h-fit p-6 lg:col-span-2">
        <h2 className="font-semibold text-white">Rental plans</h2>
        <ul className="mt-4 divide-y divide-white/10">
          {d.plans.map((p) => (
            <li key={p.id} className="flex justify-between py-2.5 text-sm"><span>{formatDuration(p.duration_seconds)}</span><span className="font-semibold text-white">{formatPrice(p.price, p.currency)}</span></li>
          ))}
          {d.plans.length === 0 && <li className="py-2 text-sm text-slate-400">No plans enabled.</li>}
        </ul>
        {canRent
          ? <Link href={`/rent/${d.domain_name}`} className="btn-primary mt-6 w-full">Rent Now</Link>
          : <button className="btn-primary mt-6 w-full" disabled>{d.is_demo ? 'Sample listing' : d.status === 'RENTED' ? 'Currently rented' : 'Unavailable'}</button>}
        <Link href="/explore" className="mt-3 block text-center text-sm text-slate-400 hover:text-white">Back to all domains</Link>
      </aside>
    </div>
  );
}
