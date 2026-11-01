import { db } from '@/lib/supabase-admin';
import { bad, ok } from '@/lib/api';
import { limit, sameOrigin, sha256, newToken } from '@/lib/security';
import { isRef } from '@/lib/validate';

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (!(await limit(req, 'status', 40, 600))) return bad('Too many requests. Please try again later.', 429);
  let b;
  try { b = await req.json(); } catch { return bad('Invalid request'); }
  const ref = String(b.reference || '').toUpperCase().trim();
  const token = String(b.token || '');
  const notFound = () => bad('Booking not found. Check your reference and secret link.', 404);
  if (!isRef(ref) || token.length < 20 || token.length > 100) return notFound();

  await db().rpc('expire_rentals'); // lazy, idempotent expiry on every status check
  const { data: bk } = await db()
    .from('bookings')
    .select('id, booking_reference, status, duration_seconds, payment_deadline, rental_started_at, rental_expires_at, created_at, domains(domain_name), payments(method, amount, currency, status, rejection_reason, transaction_reference, transaction_hash)')
    .eq('booking_reference', ref).eq('status_token_hash', sha256(token)).maybeSingle();
  if (!bk) return notFound();

  const payment = bk.payments;
  const out = {
    reference: bk.booking_reference, status: bk.status, domain: bk.domains.domain_name,
    durationSeconds: bk.duration_seconds, paymentDeadline: bk.payment_deadline,
    startedAt: bk.rental_started_at, expiresAt: bk.rental_expires_at, createdAt: bk.created_at,
    serverNow: new Date().toISOString(),
    payment: {
      method: payment.method, amount: payment.amount, currency: payment.currency, status: payment.status,
      rejectionReason: payment.rejection_reason, submitted: Boolean(payment.transaction_reference || payment.transaction_hash),
    },
  };
  if (bk.status === 'PENDING_PAYMENT') {
    const { data: m } = await db().from('payment_methods')
      .select('method, instructions, receiving_number, wallet_address, networks, tokens, min_confirmations').eq('method', payment.method).maybeSingle();
    out.instructions = m;
  }
  if (bk.status === 'ACTIVE') {
    const cap = newToken();
    const { data: issued } = await db().rpc('issue_capability', { p_booking: bk.id, p_hash: sha256(cap) });
    if (issued === true) out.capabilityToken = cap; // shown exactly once
  }
  return ok(out);
}
