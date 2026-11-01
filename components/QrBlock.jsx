'use client';
import { useEffect, useRef } from 'react';
// Minimal QR via a tiny dependency-free fallback is not practical; we use the `qrcode` package, loaded on demand.
export default function QrBlock({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    import('qrcode').then((Q) => alive && ref.current && Q.toCanvas(ref.current, text, { width: 160, margin: 1, color: { dark: '#0b0b1e', light: '#ffffff' } }));
    return () => { alive = false; };
  }, [text]);
  return <canvas ref={ref} className="rounded-xl bg-white p-1" aria-label="QR code of wallet address" width="160" height="160" />;
}
