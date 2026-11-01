# RENTEX DOMAINS

Login-free domain rental marketplace. Next.js 14 (App Router, JavaScript), Tailwind CSS, Supabase (Postgres + Auth for admins only), Vercel.

> **Build status:** this project was generated without network access, so `npm install` and `next build` have NOT been run. Run `npm install && npm run build` locally first and fix anything it reports before deploying.

## What works immediately vs. what needs your credentials

| Works after Supabase setup (no third-party credentials) | Needs your real credentials / work |
|---|---|
| Public site, 10 SAMPLE listings, search/filter/sort/pagination | **Payment collection**: enable a method and enter YOUR receiving number/wallet in Admin > Payment methods |
| Booking, secret status link, payment-proof submission | **Payment verification** is manual: the admin checks bKash/Nagad/Rocket records or a block explorer. Automated on-chain verification is NOT implemented |
| Admin approve/reject, atomic activation, server-side expiry, revoke, audit log | **Real DNS control**: only `DEMO` provider exists (no DNS is changed). Implement a provider in `lib/dns/` |
| Rate limiting, duplicate-transaction prevention | Real, verified domains: replace sample listings in Admin > Domains |

## 1. Supabase setup
1. Create a project at supabase.com.
2. SQL Editor: run `supabase/migrations/001_schema.sql`, then `002_seed_demo.sql`.
3. Authentication > Users > Add user (email + password) for yourself. Disable public sign-ups (Authentication > Providers > Email > turn off "Allow new users to sign up").
4. Make that user an admin (SQL Editor):
   `insert into admin_users (user_id) select id from auth.users where email = 'you@example.com';`
5. Project Settings > API: copy the URL, anon key and service_role key.

## 2. Local development
```
cp .env.example .env.local   # fill in values
npm install
npm run dev                   # http://localhost:3000
npm run build                 # production build check
```
Admin: `/admin/login`. Then Admin > Payment methods: fill in and enable at least one method. Add a real domain in Admin > Domains: tick *Verified* only for domains you truly own, set plans and prices.

## 3. GitHub
```
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOU/rentex-domains.git
git push -u origin main
```
`.env*` files are git-ignored. Never commit keys.

## 4. Vercel
1. Import the GitHub repo in Vercel (framework: Next.js).
2. Add environment variables from `.env.example` (mark `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` as server-only; never prefix them with `NEXT_PUBLIC_`). Set `NEXT_PUBLIC_SITE_URL` to your domain.
3. Deploy. `vercel.json` registers a daily backup expiry cron (`/api/cron/expire`, Hobby plan allows daily only). Expiry is ALSO enforced on every status check, admin page load and rental action, and the DB denies access past `rental_expires_at` regardless of cron. For minute-level sweeps use Vercel Pro or an external pinger sending `Authorization: Bearer $CRON_SECRET`.

## Route map
Home `/`, Marketplace `/explore`, Domain details `/domains/[name]`, Checkout `/rent/[name]`, Payment instructions + submission + confirmation + status `/booking/[ref]` (secret token travels in the URL #fragment, so it is never sent to the server or in Referer headers), Check status `/my-booking`, `/how-it-works`, `/terms`, `/privacy`, `/contact`, Admin `/admin/*`.

## Booking state machine
`PENDING_PAYMENT -> PENDING_VERIFICATION -> ACTIVE -> EXPIRED` (+ `CANCELLED` on rejection, `REVOKED` by admin). `approve_payment()` performs APPROVED and ACTIVE in one transaction (both recorded in `audit_logs`).

## Security notes
- All tables have RLS enabled; customers never query tables directly. The server uses the service-role key only after its own validation. SQL functions are executable by `service_role` only.
- Price, duration, deadline and expiry are computed in SQL from the plan, never from the browser. A partial unique index guarantees one live booking per domain; the domain row is locked during booking and approval.
- Transaction IDs/hashes are unique across non-rejected payments.
- Status tokens are 256-bit random, stored as SHA-256 only. Wrong ref/token returns the same 404.
- Rate limits are stored in Postgres (`rate_limit_hit`), fail closed. Public POSTs require same-origin (CSRF); admin routes additionally require a Supabase session + `admin_users` membership.
- Rental access token (`rental_capabilities`) is shown once, revoked on expiry/revoke, and checked by `authorize_rental()` using DB time.

## Security checklist before launch
- [ ] Sign-ups disabled in Supabase Auth; only your admin user exists and is in `admin_users`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` set only in Vercel server env
- [ ] Strong admin password + MFA on Supabase, GitHub and Vercel accounts
- [ ] Receiving numbers/wallets entered correctly (public addresses only, no seed phrases)
- [ ] Sample listings removed/disabled when real domains are added
- [ ] Terms/Privacy text reviewed by a professional; `NEXT_PUBLIC_CONTACT_EMAIL` set
- [ ] Domain registrar/DNS credentials are NOT in this app until a reviewed provider integration exists
- [ ] `npm run build` passes; test full flow with a real small payment end to end
