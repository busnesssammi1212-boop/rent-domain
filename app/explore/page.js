import Link from 'next/link';
import DomainCard from '@/components/DomainCard';
import { EmptyState } from '@/components/ui';
import { listDomains } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Explore Domains' };
const PAGE = 6;

export default async function Explore({ searchParams }) {
  const q = String(searchParams.q || '').toLowerCase().slice(0, 60);
  const category = String(searchParams.category || '');
  const maxPrice = Number(searchParams.max) || null;
  const sort = searchParams.sort === 'desc' ? 'desc' : searchParams.sort === 'asc' ? 'asc' : '';
  const page = Math.max(1, parseInt(searchParams.page, 10) || 1);

  let list = await listDomains();
  const categories = [...new Set(list.map((d) => d.category))].sort();
  list = list.filter((d) => (!q || d.domain_name.includes(q)) && (!category || d.category === category) && (!maxPrice || (d.fromPrice != null && d.fromPrice <= maxPrice)));
  if (sort) list.sort((a, b) => (sort === 'asc' ? 1 : -1) * ((a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity)));
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const link = (p) => { const u = new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(maxPrice && { max: String(maxPrice) }), ...(sort && { sort }), page: String(p) }); return `/explore?${u}`; };

  return (
    <div className="container-x py-12">
      <h1 className="text-3xl font-bold text-white">Explore Domains</h1>
      <p className="mt-2 text-sm text-slate-400">Listings marked SAMPLE are demonstration data and cannot be rented.</p>
      <form className="glass mt-8 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5" role="search">
        <div className="lg:col-span-2"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={q} placeholder="e.g. cloud" className="input" /></div>
        <div><label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={category} className="input"><option value="">All</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label" htmlFor="max">Max price</label><input id="max" name="max" type="number" min="0" defaultValue={maxPrice || ''} className="input" /></div>
        <div><label className="label" htmlFor="sort">Sort</label>
          <select id="sort" name="sort" defaultValue={sort} className="input"><option value="">Default</option><option value="asc">Price: low to high</option><option value="desc">Price: high to low</option></select></div>
        <div className="sm:col-span-2 lg:col-span-5 flex gap-3"><button className="btn-primary">Apply</button><Link href="/explore" className="btn-ghost">Reset</Link></div>
      </form>

      <div className="mt-8">
        {shown.length === 0
          ? <EmptyState title="No domains match" action={<Link href="/explore" className="btn-primary mt-6">Clear filters</Link>}>Try a different search or remove a filter.</EmptyState>
          : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{shown.map((d) => <DomainCard key={d.id} d={d} />)}</div>}
      </div>
      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 && <Link className="btn-ghost" href={link(page - 1)}>Previous</Link>}
          <span className="text-sm text-slate-400">Page {page} of {pages}</span>
          {page < pages && <Link className="btn-ghost" href={link(page + 1)}>Next</Link>}
        </nav>
      )}
    </div>
  );
}
