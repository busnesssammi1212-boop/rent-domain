import 'server-only';
import crypto from 'crypto';
import { db } from './supabase-admin';

export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const newToken = () => crypto.randomBytes(32).toString('base64url');

const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function newReference() {
  const bytes = crypto.randomBytes(10);
  let s = '';
  for (const b of bytes) s += ALPHA[b % ALPHA.length];
  return `RX-${s.slice(0, 5)}-${s.slice(5)}`;
}

export function clientIp(req) {
  const f = req.headers.get('x-forwarded-for');
  return (f ? f.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';
}

// CSRF defence for cookie-authenticated and public POST routes: require same-origin.
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.get('host'); } catch { return false; }
}

// Fixed-window limiter stored in Postgres (works across serverless instances). Fails closed.
export async function limit(req, name, max, windowSec) {
  const { data, error } = await db().rpc('rate_limit_hit', { p_key: `${name}:${clientIp(req)}`, p_max: max, p_window: windowSec });
  if (error) { console.error('rate limit error', error.message); return false; }
  return data === true;
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function audit(actor, action, type, id, metadata = {}) {
  await db().from('audit_logs').insert({ actor_id: actor || null, action, resource_type: type, resource_id: String(id ?? ''), metadata });
}
