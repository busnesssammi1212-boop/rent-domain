import { db } from '@/lib/supabase-admin';
import { adminRoute, bad, ok } from '@/lib/api';
import { audit } from '@/lib/security';
import { clean, METHODS } from '@/lib/validate';

const list = (s) => String(s || '').split(',').map((x) => clean(x, 40)).filter(Boolean).slice(0, 20);

export async function POST(req) {
  return adminRoute(req, async (admin, b) => {
    if (!METHODS.includes(b.method)) return bad('Invalid method');
    const crypto = b.method === 'CRYPTO';
    const enabled = b.is_enabled === true;
    const number = clean(b.receiving_number, 40);
    const wallet = clean(b.wallet_address, 120);
    if (enabled && !crypto && !number) return bad('A receiving number is required to enable this method');
    if (enabled && crypto && (!wallet || !list(b.networks).length || !list(b.tokens).length)) return bad('Wallet address, networks and tokens are required to enable crypto');
    const { error } = await db().from('payment_methods').update({
      is_enabled: enabled, instructions: clean(b.instructions, 600), receiving_number: crypto ? null : number || null,
      wallet_address: crypto ? wallet || null : null, networks: list(b.networks), tokens: list(b.tokens),
      min_confirmations: Math.max(0, Math.min(1000, parseInt(b.min_confirmations, 10) || 0)), updated_at: new Date().toISOString(),
    }).eq('method', b.method);
    if (error) return bad('Could not save settings');
    await audit(admin.id, 'PAYMENT_METHOD_UPDATED', 'payment_method', b.method, { enabled });
    return ok();
  });
}
