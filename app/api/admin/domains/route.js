import { db } from '@/lib/supabase-admin';
import { adminRoute, bad, ok } from '@/lib/api';
import { audit } from '@/lib/security';
import { isUuid, isDomain, clean, PLAN_SECONDS } from '@/lib/validate';

export async function POST(req) {
  return adminRoute(req, async (admin, b) => {
    const name = clean(b.domain_name, 253).toLowerCase();
    if (!isDomain(name)) return bad('Invalid domain name');
    const verified = b.verified === true;
    if (verified && b.confirmOwnership !== true) return bad('Confirm that you own or control this domain before marking it verified');
    const row = {
      domain_name: name, description: clean(b.description, 500), category: clean(b.category, 40) || 'General',
      is_active: b.is_active !== false, is_demo: !verified, verification_status: verified ? 'VERIFIED' : 'DEMO',
    };
    let id = b.id;
    if (id) {
      if (!isUuid(id)) return bad('Invalid id');
      const { error } = await db().from('domains').update(row).eq('id', id);
      if (error) return bad(error.code === '23505' ? 'That domain already exists' : 'Could not save domain');
    } else {
      const { data, error } = await db().from('domains').insert(row).select('id').single();
      if (error) return bad(error.code === '23505' ? 'That domain already exists' : 'Could not save domain');
      id = data.id;
    }
    for (const p of Array.isArray(b.plans) ? b.plans : []) {
      const secs = Number(p.duration_seconds); const price = Number(p.price);
      const currency = clean(p.currency, 5).toUpperCase();
      if (!PLAN_SECONDS.includes(secs) || !(price >= 0) || price > 10000000 || !/^[A-Z]{3,5}$/.test(currency)) return bad('Invalid plan values');
      const { error } = await db().from('rental_plans').upsert({ domain_id: id, duration_seconds: secs, price, currency, is_active: p.is_active === true }, { onConflict: 'domain_id,duration_seconds' });
      if (error) return bad('Could not save plans');
    }
    await audit(admin.id, b.id ? 'DOMAIN_UPDATED' : 'DOMAIN_CREATED', 'domain', id, { domain: name, verified });
    return ok({ id });
  });
}
