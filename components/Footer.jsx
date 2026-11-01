import Link from 'next/link';
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-black/20">
      <div className="container-x grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="font-bold">RENTEX <span className="gradient-text">DOMAINS</span></p>
          <p className="mt-2 max-w-xs text-sm text-slate-400">Short-term domain rentals with manual, human-verified payments.</p>
        </div>
        <ul className="space-y-2 text-sm text-slate-400">
          <li><Link className="hover:text-white" href="/explore">Explore Domains</Link></li>
          <li><Link className="hover:text-white" href="/how-it-works">How It Works</Link></li>
          <li><Link className="hover:text-white" href="/my-booking">My Booking</Link></li>
        </ul>
        <ul className="space-y-2 text-sm text-slate-400">
          <li><Link className="hover:text-white" href="/terms">Terms of Service</Link></li>
          <li><Link className="hover:text-white" href="/privacy">Privacy Policy</Link></li>
          <li><Link className="hover:text-white" href="/contact">Contact</Link></li>
        </ul>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} RENTEX DOMAINS. Listings marked SAMPLE are demonstration data only.</p>
    </footer>
  );
}
