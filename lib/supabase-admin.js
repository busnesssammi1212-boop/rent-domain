import 'server-only';
import { createClient } from '@supabase/supabase-js';

let client;
// Service-role client. Server only: bypasses RLS, so every caller must authorize first.
export function db() {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
