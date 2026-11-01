import { db } from '@/lib/supabase-admin';
import { adminRoute, bad, ok, fail } from '@/lib/api';
import { isUuid, clean } from '@/lib/validate';

export async function POST(req) {
  return adminRoute(req, async (admin, b) => {
    if (!isUuid(b.paymentId)) return bad('Invalid payment');
    if (b.action === 'approve') {
      if (b.confirmed !== true) return bad('Confirm that you verified the transaction first');
      const { data, error } = await db().rpc('approve_payment', { p_payment: b.paymentId, p_admin: admin.id });
      if (error) return fail(error);
      return ok({ expiresAt: data });
    }
    if (b.action === 'reject') {
      const reason = clean(b.reason, 300);
      if (reason.length < 3) return bad('A rejection reason is required');
      const { error } = await db().rpc('reject_payment', { p_payment: b.paymentId, p_admin: admin.id, p_reason: reason });
      if (error) return fail(error);
      return ok();
    }
    return bad('Unknown action');
  });
}
