'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../Toast';
import { post } from './post';

export default function RevokeButton({ bookingId }) {
  const toast = useToast(); const router = useRouter(); const [busy, setBusy] = useState(false);
  return <button className="btn-danger py-1.5" disabled={busy} onClick={async () => {
    const reason = window.prompt('Reason for revoking this rental?');
    if (!reason) return;
    setBusy(true);
    try { await post('/api/admin/rentals', { action: 'revoke', bookingId, reason }); toast('Rental revoked'); router.refresh(); } catch (e) { toast(e.message, 'error'); setBusy(false); }
  }}>Revoke</button>;
}
