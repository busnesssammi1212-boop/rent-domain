import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase-admin';
import { safeEqual } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Backup expiry sweep. Vercel Cron sends "Authorization: Bearer $CRON_SECRET".
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') || '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await db().rpc('expire_rentals');
  if (error) return NextResponse.json({ error: 'failed' }, { status: 500 });
  return NextResponse.json({ expired: data });
}
