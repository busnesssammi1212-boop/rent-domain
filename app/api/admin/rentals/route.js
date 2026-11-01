import { db } from '@/lib/supabase-admin';
import { adminRoute, bad, ok, fail } from '@/lib/api';
import { isUuid, clean } from '@/lib/validate';

export async function POST(req) {
  return adminRoute(req, async (admin, b) => {
    if (b.action !== 'revoke' || !isUuid(b.bookingId)) return bad('Invalid request');
    const { error } = await db().rpc('revoke_rental', { p_booking: b.bookingId, p_admin: admin.id, p_reason: clean(b.reason, 300) || 'No reason given' });
    if (error) return fail(error);
    return ok();
  });
}
