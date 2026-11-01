import 'server-only';
import demo from './demo';

// Provider abstraction. To integrate a real provider (Cloudflare, Route53, ...):
//  1. Implement { listRecords(domain), setRecord(domain, record) } in lib/dns/<provider>.js
//  2. Register it below and set DNS_PROVIDER.
//  3. Use least-privilege API tokens scoped to the single zone(s) you own; keep them server-side.
//  4. Only call it after authorize_rental() succeeds and the domain is verified & owned by you.
//  5. Define the expiry cleanup (e.g. restore the pre-rental snapshot) inside the cron/expire flow.
const providers = { demo };
export function getDnsProvider() {
  const name = process.env.DNS_PROVIDER || 'demo';
  const p = providers[name];
  if (!p) throw new Error(`Unknown DNS provider "${name}"`);
  return p;
}
