import { db } from '@/lib/supabase-admin';
import { bad, ok, fail } from '@/lib/api';
import { limit, sameOrigin, newToken, newReference, sha256 } from '@/lib/security';
import { clean, isUuid, isEmail, isPhone, METHODS } from '@/lib/validate';

export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (!(await limit(req, 'booking', 5, 600))) return bad('Too many requests. Please try again later.', 429);
  let b;
  try { b = await req.json(); } catch { return bad('Invalid request'); }
  const contact = clean(b.contact, 120);
  const name = clean(b.name, 60);
  if (!isUuid(b.domainId) || !isUuid(b.planId)) return bad('Invalid selection');
  if (!(isEmail(contact) || isPhone(contact))) return bad('Enter a valid email or phone number');
  if (!METHODS.includes(b.method)) return bad('Choose a payment method');
  if (b.accepted !== true) return bad('You must accept the Terms of Service');

  const token = newToken();
  const reference = newReference();
  // Price, duration and deadline are all computed inside the database function, never from the browser.
  const { data, error } = await db().rpc('create_booking', {
    p_domain: b.domainId, p_plan: b.planId, p_contact: contact, p_name: name || null,
    p_method: b.method, p_ref: reference, p_token_hash: sha256(token),
  });
  if (error) return fail(error);
  const row = Array.isArray(data) ? data[0] : data;
  return ok({ reference, token, amount: row.amount, currency: row.currency, deadline: row.payment_deadline });
}
