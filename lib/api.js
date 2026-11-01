import 'server-only';
import { NextResponse } from 'next/server';
import { getAdmin } from './admin-auth';
import { sameOrigin } from './security';

export const bad = (error, status = 400) => NextResponse.json({ error }, { status });
export const ok = (data = {}) => NextResponse.json(data);

const MAP = {
  DOMAIN_UNAVAILABLE: [409, 'This domain is not available to rent right now.'],
  SAMPLE_DOMAIN: [403, 'Sample listings cannot be rented.'],
  PLAN_UNAVAILABLE: [409, 'That rental plan is not available.'],
  METHOD_UNAVAILABLE: [409, 'That payment method is not available.'],
  TOO_MANY_OPEN: [429, 'You already have open bookings. Complete or wait for them to lapse.'],
  BOOKING_NOT_PAYABLE: [409, 'This booking can no longer accept a payment (it may have lapsed).'],
  DUPLICATE_TRANSACTION: [409, 'This transaction was already submitted for another booking.'],
  MISSING_FIELDS: [400, 'Please fill in the required payment fields.'],
  INVALID_STATE: [409, 'This item is no longer in a state where that action is allowed.'],
};

// Maps known database exception codes to safe messages; never leaks internals.
export function fail(error) {
  const code = (error?.message || '').trim();
  if (MAP[code]) return bad(MAP[code][1], MAP[code][0]);
  console.error('Unhandled error:', error);
  return bad('Something went wrong. Please try again.', 500);
}

// Wrapper for every admin mutation: same-origin + authenticated admin on the server.
export async function adminRoute(req, handler) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  const admin = await getAdmin();
  if (!admin) return bad('Unauthorized', 401);
  let body;
  try { body = await req.json(); } catch { return bad('Invalid JSON'); }
  try { return await handler(admin, body); } catch (e) { return fail(e); }
}
