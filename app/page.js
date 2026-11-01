import Link from 'next/link';
import DomainCard from '@/components/DomainCard';
import { listDomains } from '@/lib/data';

export const dynamic = 'force-dynamic';

const features = [
  ['Available domains', 'Browse listings with clear availability status.'],
  ['Flexible rental periods', 'From 30 minutes up to 30 days, set per listing.'],
  ['Secure payment verification', 'Every payment is checked by a person before activation.'],
  ['Automatic rental expiration', 'The server enforces the end time. Not a browser timer.'],
];
const steps = [
  ['1', 'Choose a domain', 'Pick a listing and a rental period. No account needed.'],
  ['2', 'Pay and submit proof', 'Send the exact amount, then submit your transaction ID or hash.'],
  ['3', 'Get verified and go live', 'After an administrator verifies the payment, your rental starts and the countdown begins.'],
];
const faqs = [
  ['Do I need an account?', 'No. You receive a booking reference and a secret status link to track your booking.'],
  ['Are the listings real?', 'Listings marked SAMPLE are demonstration data. They are not owned, registered or offered for sale. Only verified listings can be rented.'],
  ['Is my payment confirmed instantly?', 'No. Submitting a transaction ID is not proof of payment. An administrator verifies it first.'],
  ['What happens when time runs out?', 'The server marks the rental expired and denies further rental actions immediately. The domain owner always keeps control of the domain.'],
];

export default async function Home() {
  const all = await listDomains();
  const featured = [...all].sort((a, b) => Number(a.is_demo) - Number(b.is_demo)).slice(0, 3);
  return (
    <>
      <section className="container-x relative py-20 text-center sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 animate-floaty rounded-full bg-violet-600/30 blur-3xl" aria-hidden />
        <h1 className="relative mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">Your Next Domain. <span className="gradient-text">Your Terms.</span></h1>
        <p className="relative mx-auto mt-6 max-w-xl text-lg text-slate-300">Discover premium domains and rent the perfect digital address for your next project.</p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/explore" className="btn-primary px-7 py-3">Explore Domains</Link>
          <Link href="/how-it-works" className="btn-ghost px-7 py-3">How It Works</Link>
        </div>
      </section>

      <section className="container-x grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([t, d]) => (
          <div key={t} className="glass glass-hover p-5"><p className="font-semibold text-white">{t}</p><p className="mt-1 text-sm text-slate-400">{d}</p></div>
        ))}
      </section>

      <section className="container-x mt-24">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-white">Featured domains</h2>
          <Link href="/explore" className="text-sm text-violet-300 hover:underline">View all</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map((d) => <DomainCard key={d.id} d={d} />)}</div>
      </section>

      <section className="container-x mt-24">
        <h2 className="mb-6 text-2xl font-bold text-white">Rent in three steps</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="glass p-6"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 font-bold text-white">{n}</span>
              <p className="mt-4 font-semibold text-white">{t}</p><p className="mt-1 text-sm text-slate-400">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="container-x mt-24 max-w-3xl">
        <h2 className="mb-6 text-2xl font-bold text-white">FAQ</h2>
        <div className="space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="glass group p-5"><summary className="cursor-pointer list-none font-medium text-white">{q}</summary><p className="mt-3 text-sm text-slate-400">{a}</p></details>
          ))}
        </div>
      </section>
    </>
  );
}
