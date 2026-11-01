-- RENTEX DOMAINS schema. Run in Supabase SQL editor (or supabase db push).
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Admin allowlist: only users listed here may use /admin. Rows are added manually (see README).
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  domain_name text not null unique,
  description text not null default '',
  category text not null default 'General',
  verification_status text not null default 'DEMO' check (verification_status in ('DEMO','PENDING','VERIFIED')),
  is_demo boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint domain_lower check (domain_name = lower(domain_name)),
  constraint domain_fmt check (domain_name ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'),
  constraint demo_not_verified check (not (is_demo and verification_status = 'VERIFIED'))
);
create trigger domains_updated before update on public.domains for each row execute function public.set_updated_at();
create index domains_active_idx on public.domains (is_active, category);

create table public.rental_plans (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  duration_seconds integer not null check (duration_seconds in (1800,2400,3600,86400,604800,2592000)),
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'BDT' check (currency ~ '^[A-Z]{3,5}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (domain_id, duration_seconds)
);
create index plans_domain_idx on public.rental_plans (domain_id) where is_active;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  domain_id uuid not null references public.domains(id),
  rental_plan_id uuid not null references public.rental_plans(id),
  duration_seconds integer not null check (duration_seconds > 0),   -- snapshot of the plan
  customer_contact text not null check (char_length(customer_contact) between 5 and 120),
  customer_name text check (customer_name is null or char_length(customer_name) <= 60),
  status text not null default 'PENDING_PAYMENT'
    check (status in ('PENDING_PAYMENT','PENDING_VERIFICATION','APPROVED','ACTIVE','EXPIRED','CANCELLED','REVOKED')),
  status_token_hash text not null unique,                            -- sha256 of the secret status token
  payment_deadline timestamptz not null,
  rental_started_at timestamptz,
  rental_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_has_times check (status not in ('ACTIVE','EXPIRED','REVOKED') or (rental_started_at is not null and rental_expires_at is not null))
);
create trigger bookings_updated before update on public.bookings for each row execute function public.set_updated_at();
create index bookings_domain_status_idx on public.bookings (domain_id, status);
create index bookings_expiry_idx on public.bookings (rental_expires_at) where status = 'ACTIVE';
create index bookings_contact_idx on public.bookings (customer_contact) where status = 'PENDING_PAYMENT';
-- Hard guarantee: at most one live booking per domain at any time.
create unique index one_live_booking_per_domain on public.bookings (domain_id)
  where status in ('PENDING_PAYMENT','PENDING_VERIFICATION','APPROVED','ACTIVE');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  method text not null check (method in ('BKASH','NAGAD','ROCKET','CRYPTO')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null,
  transaction_reference text,
  transaction_hash text,
  sender_info text,
  payment_note text,
  crypto_network text,
  crypto_token text,
  status text not null default 'PENDING_PAYMENT' check (status in ('PENDING_PAYMENT','PENDING_VERIFICATION','APPROVED','REJECTED')),
  rejection_reason text,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
-- A transaction id / hash can back only one non-rejected payment.
create unique index payments_txn_ref_uq on public.payments (lower(transaction_reference)) where transaction_reference is not null and status <> 'REJECTED';
create unique index payments_txn_hash_uq on public.payments (lower(transaction_hash)) where transaction_hash is not null and status <> 'REJECTED';
create index payments_status_idx on public.payments (status, created_at);

create table public.payment_methods (
  method text primary key check (method in ('BKASH','NAGAD','ROCKET','CRYPTO')),
  is_enabled boolean not null default false,
  instructions text not null default '',
  receiving_number text,
  wallet_address text,
  networks jsonb not null default '[]',
  tokens jsonb not null default '[]',
  min_confirmations integer not null default 12 check (min_confirmations >= 0),
  updated_at timestamptz not null default now()
);

create table public.rental_capabilities (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  token_hash text not null unique,
  permissions text[] not null default array['dns:read','dns:write'],
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_live_capability on public.rental_capabilities (booking_id) where revoked_at is null;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_resource_idx on public.audit_logs (resource_type, resource_id, created_at desc);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window int) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_start timestamptz; v_hits int;
begin
  v_start := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window);
  insert into rate_limits (key, window_start, hits) values (p_key, v_start, 1)
  on conflict (key, window_start) do update set hits = rate_limits.hits + 1
  returning hits into v_hits;
  if random() < 0.02 then delete from rate_limits where window_start < now() - interval '1 day'; end if;
  return v_hits <= p_max;
end $$;

create or replace function public.blocked_domain_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select distinct domain_id from bookings
  where status in ('PENDING_VERIFICATION','APPROVED')
     or (status = 'PENDING_PAYMENT' and payment_deadline > now())
     or (status = 'ACTIVE' and rental_expires_at > now());
$$;

-- Lapse stale holds and finished rentals. Idempotent; safe to call from anywhere.
create or replace function public.expire_rentals() returns int
language plpgsql security definer set search_path = public as $$
declare v_count int := 0; r record;
begin
  for r in select id from bookings where status = 'ACTIVE' and rental_expires_at <= now() for update skip locked loop
    update bookings set status = 'EXPIRED' where id = r.id and status = 'ACTIVE';
    update rental_capabilities set revoked_at = now() where booking_id = r.id and revoked_at is null;
    insert into audit_logs (action, resource_type, resource_id) values ('RENTAL_EXPIRED', 'booking', r.id::text);
    v_count := v_count + 1;
  end loop;
  for r in select id from bookings where status = 'PENDING_PAYMENT' and payment_deadline <= now() for update skip locked loop
    update bookings set status = 'EXPIRED' where id = r.id and status = 'PENDING_PAYMENT';
    insert into audit_logs (action, resource_type, resource_id) values ('HOLD_LAPSED', 'booking', r.id::text);
  end loop;
  return v_count;
end $$;

create or replace function public.create_booking(
  p_domain uuid, p_plan uuid, p_contact text, p_name text, p_method text, p_ref text, p_token_hash text
) returns table (booking_id uuid, amount numeric, currency text, payment_deadline timestamptz)
language plpgsql security definer set search_path = public as $$
declare d domains; pl rental_plans; m payment_methods; v_id uuid; v_deadline timestamptz; v_open int;
begin
  perform expire_rentals();
  select * into d from domains where id = p_domain for update;        -- serialises bookings per domain
  if not found or not d.is_active then raise exception 'DOMAIN_UNAVAILABLE'; end if;
  if d.is_demo or d.verification_status <> 'VERIFIED' then raise exception 'SAMPLE_DOMAIN'; end if;
  select * into pl from rental_plans where id = p_plan and domain_id = p_domain and is_active;
  if not found then raise exception 'PLAN_UNAVAILABLE'; end if;
  select * into m from payment_methods where method = p_method and is_enabled;
  if not found then raise exception 'METHOD_UNAVAILABLE'; end if;
  if exists (select 1 from blocked_domain_ids() x where x = p_domain) then raise exception 'DOMAIN_UNAVAILABLE'; end if;
  select count(*) into v_open from bookings where customer_contact = p_contact and status = 'PENDING_PAYMENT' and bookings.payment_deadline > now();
  if v_open >= 2 then raise exception 'TOO_MANY_OPEN'; end if;
  v_deadline := now() + interval '30 minutes';
  insert into bookings (booking_reference, domain_id, rental_plan_id, duration_seconds, customer_contact, customer_name, status_token_hash, payment_deadline)
  values (p_ref, p_domain, p_plan, pl.duration_seconds, p_contact, p_name, p_token_hash, v_deadline) returning id into v_id;
  insert into payments (booking_id, method, amount, currency) values (v_id, p_method, pl.price, pl.currency);
  insert into audit_logs (action, resource_type, resource_id, metadata) values ('BOOKING_CREATED', 'booking', v_id::text, jsonb_build_object('domain', d.domain_name, 'seconds', pl.duration_seconds));
  return query select v_id, pl.price, pl.currency, v_deadline;
end $$;

create or replace function public.submit_payment(
  p_booking uuid, p_txn_ref text, p_txn_hash text, p_sender text, p_note text, p_network text, p_token text
) returns void language plpgsql security definer set search_path = public as $$
declare b bookings; p payments;
begin
  select * into b from bookings where id = p_booking for update;
  if not found or b.status <> 'PENDING_PAYMENT' or b.payment_deadline <= now() then raise exception 'BOOKING_NOT_PAYABLE'; end if;
  select * into p from payments where booking_id = p_booking for update;
  if p.method = 'CRYPTO' then
    if p_txn_hash is null then raise exception 'MISSING_FIELDS'; end if;
  else
    if p_txn_ref is null then raise exception 'MISSING_FIELDS'; end if;
  end if;
  begin
    update payments set transaction_reference = p_txn_ref, transaction_hash = p_txn_hash, sender_info = p_sender,
      payment_note = p_note, crypto_network = p_network, crypto_token = p_token, status = 'PENDING_VERIFICATION'
    where id = p.id;
  exception when unique_violation then raise exception 'DUPLICATE_TRANSACTION';
  end;
  update bookings set status = 'PENDING_VERIFICATION' where id = b.id;
  insert into audit_logs (action, resource_type, resource_id) values ('PAYMENT_SUBMITTED', 'payment', p.id::text);
end $$;

create or replace function public.approve_payment(p_payment uuid, p_admin uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare p payments; b bookings; d domains; v_exp timestamptz;
begin
  select * into p from payments where id = p_payment for update;
  if not found or p.status <> 'PENDING_VERIFICATION' then raise exception 'INVALID_STATE'; end if;
  select * into b from bookings where id = p.booking_id for update;
  if b.status <> 'PENDING_VERIFICATION' then raise exception 'INVALID_STATE'; end if;
  select * into d from domains where id = b.domain_id for update;
  if d.is_demo or d.verification_status <> 'VERIFIED' or not d.is_active then raise exception 'SAMPLE_DOMAIN'; end if;
  if exists (select 1 from bookings o where o.domain_id = b.domain_id and o.id <> b.id and o.status = 'ACTIVE' and o.rental_expires_at > now()) then
    raise exception 'DOMAIN_UNAVAILABLE';
  end if;
  v_exp := now() + make_interval(secs => b.duration_seconds);
  update payments set status = 'APPROVED', verified_by = p_admin, verified_at = now() where id = p.id;
  update bookings set status = 'ACTIVE', rental_started_at = now(), rental_expires_at = v_exp where id = b.id;
  insert into audit_logs (actor_id, action, resource_type, resource_id, metadata)
  values (p_admin, 'PAYMENT_APPROVED', 'payment', p.id::text, jsonb_build_object('booking', b.id, 'expires', v_exp));
  insert into audit_logs (actor_id, action, resource_type, resource_id, metadata)
  values (p_admin, 'RENTAL_ACTIVATED', 'booking', b.id::text, jsonb_build_object('expires', v_exp));
  return v_exp;
end $$;

create or replace function public.reject_payment(p_payment uuid, p_admin uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p payments;
begin
  select * into p from payments where id = p_payment for update;
  if not found or p.status <> 'PENDING_VERIFICATION' then raise exception 'INVALID_STATE'; end if;
  update payments set status = 'REJECTED', rejection_reason = p_reason, verified_by = p_admin, verified_at = now() where id = p.id;
  update bookings set status = 'CANCELLED' where id = p.booking_id;
  insert into audit_logs (actor_id, action, resource_type, resource_id, metadata)
  values (p_admin, 'PAYMENT_REJECTED', 'payment', p.id::text, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.revoke_rental(p_booking uuid, p_admin uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings;
begin
  select * into b from bookings where id = p_booking for update;
  if not found or b.status <> 'ACTIVE' then raise exception 'INVALID_STATE'; end if;
  update bookings set status = 'REVOKED', rental_expires_at = least(rental_expires_at, now()) where id = b.id;
  update rental_capabilities set revoked_at = now() where booking_id = b.id and revoked_at is null;
  insert into audit_logs (actor_id, action, resource_type, resource_id, metadata)
  values (p_admin, 'RENTAL_REVOKED', 'booking', b.id::text, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.issue_capability(p_booking uuid, p_hash text) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from bookings where id = p_booking and status = 'ACTIVE' and rental_expires_at > now()) then return false; end if;
  insert into rental_capabilities (booking_id, token_hash) values (p_booking, p_hash) on conflict do nothing;
  get diagnostics n = row_count;
  if n > 0 then insert into audit_logs (action, resource_type, resource_id) values ('CAPABILITY_ISSUED', 'booking', p_booking::text); end if;
  return n > 0;
end $$;

-- Single authorization gate for every protected rental action. Uses DB server time.
create or replace function public.authorize_rental(p_ref text, p_token_hash text, p_perm text) returns table (booking_id uuid, domain_id uuid)
language sql stable security definer set search_path = public as $$
  select b.id, b.domain_id from bookings b
  join rental_capabilities c on c.booking_id = b.id
  join payments p on p.booking_id = b.id
  where b.booking_reference = p_ref and c.token_hash = p_token_hash and c.revoked_at is null
    and b.status = 'ACTIVE' and b.rental_expires_at > now() and p.status = 'APPROVED'
    and p_perm = any (c.permissions);
$$;

do $$ declare f record; begin
  for f in select oid::regprocedure as sig from pg_proc where pronamespace = 'public'::regnamespace
    and proname in ('rate_limit_hit','blocked_domain_ids','expire_rentals','create_booking','submit_payment','approve_payment','reject_payment','revoke_rental','issue_capability','authorize_rental') loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- ---------- Row Level Security ----------
alter table public.admin_users enable row level security;
alter table public.domains enable row level security;
alter table public.rental_plans enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.payment_methods enable row level security;
alter table public.rental_capabilities enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limits enable row level security;

create policy admin_self on public.admin_users for select using (user_id = auth.uid());
create policy domains_public on public.domains for select using (is_active or public.is_admin());
create policy domains_admin on public.domains for all using (public.is_admin()) with check (public.is_admin());
create policy plans_public on public.rental_plans for select using (is_active or public.is_admin());
create policy plans_admin on public.rental_plans for all using (public.is_admin()) with check (public.is_admin());
create policy bookings_admin on public.bookings for select using (public.is_admin());
create policy payments_admin on public.payments for select using (public.is_admin());
create policy methods_admin on public.payment_methods for all using (public.is_admin()) with check (public.is_admin());
create policy caps_admin on public.rental_capabilities for select using (public.is_admin());
create policy audit_admin on public.audit_logs for select using (public.is_admin());
-- rate_limits: no policies => no access except service role.
-- Customers never touch tables directly; the Next.js server uses the service role after its own checks.

insert into public.payment_methods (method, instructions) values
  ('BKASH','Configure in Admin > Payment Methods'),('NAGAD','Configure in Admin > Payment Methods'),
  ('ROCKET','Configure in Admin > Payment Methods'),('CRYPTO','Configure in Admin > Payment Methods');
