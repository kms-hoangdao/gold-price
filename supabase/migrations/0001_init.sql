-- Giá vàng Sài Gòn: schema khởi tạo
create extension if not exists pg_cron;
create extension if not exists pg_net;

create type source_kind as enum ('gold_shop', 'fx', 'news_finance', 'news_tech');

create table sources (
  id          smallserial primary key,
  slug        text unique not null,
  name        text not null,
  kind        source_kind not null,
  url         text,
  adapter     text not null,          -- tên adapter trong supabase/functions/_shared/adapters
  active      boolean not null default true,
  last_ok_at  timestamptz,
  last_error  text
);

-- product: 'ring_9999' (nhẫn 9999) | 'bar_sjc' (vàng miếng SJC)
-- buy/sell: VND cho 1 lượng
create table prices (
  id           bigserial primary key,
  source_id    smallint not null references sources(id),
  product      text not null,
  buy          bigint not null,
  sell         bigint not null,
  needs_review boolean not null default false,
  collected_at timestamptz not null default now()
);
create index prices_latest_idx on prices (source_id, product, collected_at desc);

create table fx_rates (
  id           bigserial primary key,
  source_id    smallint not null references sources(id),
  currency     text not null default 'USD',
  buy          numeric(12,2) not null,
  sell         numeric(12,2) not null,
  collected_at timestamptz not null default now()
);
create index fx_latest_idx on fx_rates (source_id, currency, collected_at desc);

create table articles (
  id           bigserial primary key,
  source_id    smallint not null references sources(id),
  category     text not null check (category in ('finance', 'tech')),
  title        text not null,
  url          text unique not null,
  summary      text,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
create index articles_recent_idx on articles (category, published_at desc);

create table digests (
  date       date primary key,             -- ngày theo giờ Việt Nam; PK chống gửi trùng
  title      text not null,
  short      text not null,                -- nội dung push
  body       jsonb not null,
  sent_at    timestamptz
);

create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text unique not null,
  subscription jsonb not null,
  digest      boolean not null default true,  -- nhận bản tin 9h
  created_at  timestamptz not null default now()
);

create table alerts (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references push_subscriptions(id) on delete cascade,
  source_id       smallint references sources(id),
  product         text not null,             -- 'ring_9999' | 'bar_sjc' | 'usd'
  field           text not null check (field in ('buy', 'sell')),
  op              text not null check (op in ('gte', 'lte')),
  threshold       bigint not null,
  active          boolean not null default true,
  last_fired_on   date
);

-- Giá mới nhất cho mỗi (tiệm, loại vàng), kèm giá đầu ngày hôm trước để tính thay đổi
create view latest_prices as
select distinct on (p.source_id, p.product)
  s.slug, s.name, p.product, p.buy, p.sell, p.collected_at,
  (select p2.sell from prices p2
    where p2.source_id = p.source_id and p2.product = p.product
      and p2.collected_at < date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh'
    order by p2.collected_at desc limit 1) as prev_sell
from prices p join sources s on s.id = p.source_id
where s.active and not p.needs_review
order by p.source_id, p.product, p.collected_at desc;

create view latest_fx as
select distinct on (f.source_id, f.currency)
  s.slug, s.name, f.currency, f.buy, f.sell, f.collected_at
from fx_rates f join sources s on s.id = f.source_id
where s.active
order by f.source_id, f.currency, f.collected_at desc;

-- RLS: client chỉ được đọc dữ liệu công khai; mọi ghi đi qua service role
alter table sources enable row level security;
alter table prices enable row level security;
alter table fx_rates enable row level security;
alter table articles enable row level security;
alter table digests enable row level security;
alter table push_subscriptions enable row level security;
alter table alerts enable row level security;

create policy "public read" on sources for select using (true);
create policy "public read" on prices for select using (true);
create policy "public read" on fx_rates for select using (true);
create policy "public read" on articles for select using (true);
create policy "public read" on digests for select using (true);

-- Nguồn dữ liệu. URL cần kiểm tra lại trước khi bật: các trang có thể đã đổi.
insert into sources (slug, name, kind, url, adapter, active) values
  ('sjc',     'SJC',          'gold_shop',    null, 'gold_sjc',    false),
  ('pnj',     'PNJ',          'gold_shop',    null, 'gold_pnj',    false),
  ('doji',    'DOJI',         'gold_shop',    null, 'gold_doji',   false),
  ('mihong',  'Mi Hồng',      'gold_shop',    null, 'gold_mihong', false),
  ('vcb',     'Vietcombank',  'fx',           'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx', 'fx_vcb', true),
  ('usd_free','Thị trường tự do','fx',        null, 'fx_free',     false),
  ('vne_kd',  'VnExpress',    'news_finance', 'https://vnexpress.net/rss/kinh-doanh.rss', 'rss', true),
  ('cafef',   'CafeF',        'news_finance', null, 'rss',         false),
  ('hn',      'Hacker News',  'news_tech',    'https://hnrss.org/frontpage?points=200', 'rss', true),
  ('verge',   'The Verge',    'news_tech',    'https://www.theverge.com/rss/index.xml', 'rss', true);
