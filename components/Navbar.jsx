'use client';
import Link from 'next/link';
import { useState } from 'react';

const links = [
  ['/', 'Home'], ['/explore', 'Explore Domains'], ['/how-it-works', 'How It Works'], ['/my-booking', 'My Booking'], ['/contact', 'Contact'],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07061a]/70 backdrop-blur-xl">
      <nav className="container-x flex h-16 items-center justify-between" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-sm shadow-[0_0_20px_rgba(139,92,246,.7)]">R</span>
          <span>RENTEX <span className="gradient-text">DOMAINS</span></span>
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map(([href, label]) => (
            <li key={href}><Link href={href} className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">{label}</Link></li>
          ))}
        </ul>
        <button className="btn-ghost md:hidden" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
      </nav>
      {open && (
        <ul className="container-x flex flex-col gap-1 pb-4 md:hidden">
          {links.map(([href, label]) => (
            <li key={href}><Link href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-slate-200 hover:bg-white/10">{label}</Link></li>
          ))}
        </ul>
      )}
    </header>
  );
}
