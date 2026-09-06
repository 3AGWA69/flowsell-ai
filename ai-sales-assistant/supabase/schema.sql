create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'عام',
  price numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  stock integer not null default 0,
  color text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  phone text default '',
  address text default '',
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on products(category);
create index if not exists products_active_idx on products(active);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_idx on orders(created_at desc);

insert into categories(name) values ('شنط'), ('إكسسوارات'), ('عطور'), ('نظارات') on conflict (name) do nothing;

insert into products(name, category, price, cost, stock, color) values
('حقيبة Luna Mini','شنط',890,540,7,'أسود'),
('سوار Pearl Twist','إكسسوارات',420,210,18,'ذهبي'),
('عطر Velvet 50ml','عطور',760,390,11,''),
('نظارة Aura','نظارات',640,300,5,'بني')
on conflict do nothing;
