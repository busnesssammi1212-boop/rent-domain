import 'server-only';
import { db } from './supabase-admin';

export const CATEGORIES_CACHE_NOTE = 'categories are derived from listings';

async function blocked() {
  const { data } = await db().rpc('blocked_domain_ids');
  return new Set(data || []);
}

function decorate(d, blockedSet) {
  const plans = (d.rental_plans || []).filter((p) => p.is_active).sort((a, b) => a.duration_seconds - b.duration_seconds);
  let status = 'AVAILABLE';
  if (!d.is_active || plans.length === 0) status = 'UNAVAILABLE';
  else if (blockedSet.has(d.id)) status = 'RENTED';
  return { ...d, plans, status, fromPrice: plans.length ? Math.min(...plans.map((p) => Number(p.price))) : null, currency: plans[0]?.currency || 'BDT' };
}

export async function listDomains() {
  await db().rpc('expire_rentals');
  const [{ data }, b] = await Promise.all([
    db().from('domains').select('*, rental_plans(*)').eq('is_active', true).order('is_demo').order('domain_name'),
    blocked(),
  ]);
  return (data || []).map((d) => decorate(d, b));
}

export async function getDomain(name) {
  await db().rpc('expire_rentals');
  const { data } = await db().from('domains').select('*, rental_plans(*)').eq('domain_name', name.toLowerCase()).eq('is_active', true).maybeSingle();
  if (!data) return null;
  return decorate(data, await blocked());
}

export async function enabledMethods() {
  const { data } = await db().from('payment_methods').select('method').eq('is_enabled', true);
  return (data || []).map((m) => m.method);
}
