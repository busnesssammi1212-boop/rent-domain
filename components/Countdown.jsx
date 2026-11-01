'use client';
import { useEffect, useState } from 'react';

// Informational only. The server enforces the real expiry.
export default function Countdown({ until, serverNow, label }) {
  const [offset] = useState(() => (serverNow ? new Date(serverNow).getTime() - Date.now() : 0));
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(until).getTime() - (Date.now() + offset)) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [until, offset]);
  if (left === null) return null;
  const d = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <p className="font-mono text-2xl font-bold text-white" aria-label={`${label} remaining`}>
      {d > 0 && `${d}d `}{pad(h)}:{pad(m)}:{pad(s)} <span className="text-xs font-normal text-slate-400">{label}</span>
    </p>
  );
}
