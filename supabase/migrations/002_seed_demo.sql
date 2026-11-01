-- 10 DEMONSTRATION listings. They are SAMPLE data: not owned, not for sale, payment blocked by the database.
insert into public.domains (domain_name, description, category, verification_status, is_demo) values
 ('akash.com','Sample listing: short personal-brand style name.','Personal','DEMO',true),
 ('technex.site','Sample listing: technology services brand.','Technology','DEMO',true),
 ('rentex.store','Sample listing: marketplace and e-commerce.','Commerce','DEMO',true),
 ('skyzone.online','Sample listing: travel, aviation or gaming.','Entertainment','DEMO',true),
 ('nexora.site','Sample listing: startup or SaaS product.','Startup','DEMO',true),
 ('cloudnest.online','Sample listing: cloud and hosting services.','Technology','DEMO',true),
 ('pixelhub.store','Sample listing: design assets and creators.','Creative','DEMO',true),
 ('webnova.site','Sample listing: web agency or portfolio.','Technology','DEMO',true),
 ('techzone.online','Sample listing: gadgets and tech reviews.','Technology','DEMO',true),
 ('quickweb.store','Sample listing: fast landing pages.','Commerce','DEMO',true)
on conflict do nothing;

insert into public.rental_plans (domain_id, duration_seconds, price, currency)
select d.id, p.secs, round(p.base * (0.8 + (abs(hashtext(d.domain_name)) % 9) / 10.0)), 'BDT'
from public.domains d
cross join (values (1800,20),(2400,25),(3600,40),(86400,150),(604800,800),(2592000,2500)) as p(secs, base)
where d.is_demo
on conflict do nothing;
