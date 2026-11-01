import Link from 'next/link';
export const metadata = { title: 'How It Works' };
const steps = [
  ['Choose', 'Pick a verified listing and a rental period. Listings marked SAMPLE are demonstrations and cannot be rented.'],
  ['Book', 'Enter an email or phone number. You get a booking reference and a secret status link. There is no account.'],
  ['Pay', 'Send the exact amount by bKash, Nagad, Rocket or crypto within 30 minutes, then submit your transaction ID or hash.'],
  ['Verification', 'An administrator checks the real transaction record. Only then is the rental approved and started.'],
  ['Use', 'Your rental runs from the moment of activation for the plan you chose.'],
  ['Expiry', 'The server enforces the end time and revokes rental access automatically, even if your browser is closed.'],
];
export default function Page() {
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-bold text-white">How It Works</h1>
      <ol className="mt-8 space-y-4">{steps.map(([t, d], i) => (<li key={t} className="glass flex gap-4 p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 font-bold text-white">{i + 1}</span><div><p className="font-semibold text-white">{t}</p><p className="text-sm text-slate-400">{d}</p></div></li>))}</ol>
      <Link href="/explore" className="btn-primary mt-8">Explore Domains</Link>
    </div>
  );
}
