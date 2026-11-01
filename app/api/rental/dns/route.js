import { db } from '@/lib/supabase-admin';
import { bad, ok } from '@/lib/api';
import { limit, sameOrigin, sha256, audit } from '@/lib/security';
import { isRef } from '@/lib/validate';
import { getDnsProvider } from '@/lib/dns';

// Protected rental action. Authorization is re-checked in the database (server time) on EVERY request.
export async function POST(req) {
  if (!sameOrigin(req)) return bad('Forbidden', 403);
  if (!(await limit(req, 'dns', 30, 600))) return bad('Too many requests', 429);
  let b;
  try { b = await req.json(); } catch { return bad('Invalid request'); }
  const ref = String(b.reference || '').toUpperCase().trim();
  const action = b.action === 'set' ? 'set' : 'list';
  if (!isRef(ref) || String(b.capability || '').length < 20) return bad('Not authorized', 403);

  await db().rpc('expire_rentals');
  const { data } = await db().rpc('authorize_rental', { p_ref: ref, p_token_hash: sha256(b.capability), p_perm: action === 'set' ? 'dns:write' : 'dns:read' });
  const auth = Array.isArray(data) ? data[0] : data;
  if (!auth) return bad('Rental is not active or access was revoked', 403);

  const { data: dom } = await db().from('domains').select('domain_name, is_demo, verification_status').eq('id', auth.domain_id).single();
  if (dom.is_demo || dom.verification_status !== 'VERIFIED') return bad('Domain is not verified', 403);

  const provider = getDnsProvider();
  if (action === 'list') return ok(await provider.listRecords(dom.domain_name));

  const r = b.record || {};
  const type = String(r.type || '');
  const name = String(r.name || '');
  const value = String(r.value || '');
  // Renters may only manage a small allowlist of record types, with strict shape checks.
  if (!['A', 'AAAA', 'CNAME', 'TXT'].includes(type)) return bad('Record type not permitted');
  if (!/^(@|[a-z0-9-]{1,63})$/i.test(name)) return bad('Invalid record name');
  if (value.length < 1 || value.length > 255 || /[\u0000-\u001f]/.test(value)) return bad('Invalid record value');
  const result = await provider.setRecord(dom.domain_name, { type, name, value });
  await audit(null, 'DNS_CHANGE', 'booking', auth.booking_id, { domain: dom.domain_name, type, name, provider: provider.name });
  return ok(result);
}
