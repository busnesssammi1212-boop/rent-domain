import { db } from '@/lib/supabase-admin';
import { bad, ok, fail } from '@/lib/api';
import { limit, sameOrigin, sha256 } from '@/lib/security';
import { clean, isRef, isTxnId, isTxHash } from '@/lib/validate';

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (!(await limit(req, 'payment', 10, 600))) return bad('Too many requests. Please try again later.', 429);
  let b;
  try { b = await req.json(); } catch { return bad('Invalid request'); }
  const ref = String(b.reference || '').toUpperCase().trim();
  if (!isRef(ref) || String(b.token || '').length < 20) return bad('Booking not found', 404);

  const { data: bk } = await db().from('bookings').select('id, payments(method)')
    .eq('booking_reference', ref).eq('status_token_hash', sha256(b.token)).maybeSingle();
  if (!bk) return bad('Booking not found', 404);

  const crypto = bk.payments.method === 'CRYPTO';
  const txnRef = clean(b.transactionReference, 40);
  const txHash = clean(b.transactionHash, 100);
  const sender = clean(b.sender, 80);
  const note = clean(b.note, 200);
  if (crypto) {
    if (!isTxHash(txHash)) return bad('Enter a valid transaction hash');
    if (!clean(b.network, 40) || !clean(b.tokenSymbol, 20)) return bad('Select the network and token you paid with');
  } else {
    if (!isTxnId(txnRef)) return bad('Enter a valid transaction ID (letters and numbers only)');
    if (sender.length < 3) return bad('Enter the sender number or name');
  }
  const { error } = await db().rpc('submit_payment', {
    p_booking: bk.id, p_txn_ref: crypto ? null : txnRef, p_txn_hash: crypto ? txHash : null,
    p_sender: sender || null, p_note: note || null, p_network: crypto ? clean(b.network, 40) : null, p_token: crypto ? clean(b.tokenSymbol, 20) : null,
  });
  if (error) return fail(error);
  return ok({ status: 'PENDING_VERIFICATION' });
}
