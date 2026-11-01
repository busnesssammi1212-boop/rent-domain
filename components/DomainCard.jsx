import Link from 'next/link';
import { Badge, statusTone } from './ui';
import { formatPrice, hueFor } from '@/lib/format';

export function DomainVisual({ name, className = 'h-32' }) {
  const h = hueFor(name);
  return (
    <div className={`relative grid place-items-center overflow-hidden rounded-xl ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${h} 70% 35%), hsl(${(h + 60) % 360} 70% 22%))` }} aria-hidden>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <span className="text-2xl font-extrabold tracking-tight text-white/90 drop-shadow">{name.split('.')[0]}</span>
      <span className="absolute bottom-2 right-3 text-xs font-semibold text-white/60">.{name.split('.').slice(1).join('.')}</span>
    </div>
  );
}

export default function DomainCard({ d }) {
  const label = d.is_demo ? 'Demo only' : d.status === 'AVAILABLE' ? 'Available' : d.status === 'RENTED' ? 'Rented' : 'Unavailable';
  const tone = d.is_demo ? 'slate' : statusTone[d.status];
  const canRent = !d.is_demo && d.status === 'AVAILABLE';
  return (
    <article className="glass glass-hover flex flex-col p-4">
      <DomainVisual name={d.domain_name} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {d.is_demo && <Badge tone="violet">SAMPLE</Badge>}
        <Badge tone={tone}>{label}</Badge>
        <Badge>{d.category}</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white"><Link href={`/domains/${d.domain_name}`} className="hover:underline">{d.domain_name}</Link></h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-400">{d.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{d.fromPrice != null ? <>from <span className="text-base font-bold text-white">{formatPrice(d.fromPrice, d.currency)}</span></> : 'No plans'}</p>
        {canRent
          ? <Link href={`/rent/${d.domain_name}`} className="btn-primary">Rent Now</Link>
          : <Link href={`/domains/${d.domain_name}`} className="btn-ghost">{d.is_demo ? 'View sample' : 'Details'}</Link>}
      </div>
    </article>
  );
}
