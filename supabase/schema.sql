-- RestroWatch Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Restaurants
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  cuisine text,
  email_alias text,
  created_at timestamptz default now()
);

-- Users (managers + owner)
create table if not exists users (
  id uuid primary key references auth.users,
  name text,
  role text check (role in ('owner', 'manager')),
  restaurant_id uuid references restaurants(id),
  created_at timestamptz default now()
);

-- Reviews (parsed from Gmail)
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  platform text check (platform in ('swiggy', 'zomato')),
  rating int check (rating between 1 and 5),
  review_text text,
  customer_name text,
  order_id text,
  severity text check (severity in ('critical', 'high', 'medium', 'low')),
  status text default 'open' check (status in ('open', 'in_progress', 'resolved')),
  email_message_id text unique,
  email_received_at timestamptz,
  detected_at timestamptz default now(),
  first_viewed_at timestamptz,
  first_action_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Action logs
create table if not exists review_actions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id),
  user_id uuid references users(id),
  action_type text check (action_type in (
    'called_customer',
    'offered_refund',
    'offered_replacement',
    'spoke_to_delivery',
    'escalated_to_kitchen',
    'reported_to_platform',
    'owner_escalated',
    'note'
  )),
  note text,
  created_at timestamptz default now()
);

-- Gmail sync state
create table if not exists gmail_sync (
  id uuid primary key default gen_random_uuid(),
  last_history_id text,
  last_synced_at timestamptz default now()
);

-- Unmatched emails
create table if not exists unmatched_emails (
  id uuid primary key default gen_random_uuid(),
  email_message_id text unique,
  subject text,
  body text,
  platform text,
  email_received_at timestamptz,
  assigned_restaurant_id uuid references restaurants(id),
  created_at timestamptz default now()
);

-- Gmail credentials
create table if not exists gmail_credentials (
  id uuid primary key default gen_random_uuid(),
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  updated_at timestamptz default now()
);

-- Performance indexes for common dashboard and list queries
create index if not exists idx_restaurants_name on restaurants(name);
create index if not exists idx_restaurants_email_alias_lower on restaurants(lower(email_alias));

create index if not exists idx_reviews_detected_at on reviews(detected_at desc);
create index if not exists idx_reviews_created_at on reviews(created_at desc);
create index if not exists idx_reviews_resolved_at on reviews(resolved_at desc);
create index if not exists idx_reviews_restaurant_status on reviews(restaurant_id, status);
create index if not exists idx_reviews_severity_status on reviews(severity, status);
create index if not exists idx_reviews_platform on reviews(platform);

create index if not exists idx_review_actions_review_created_at on review_actions(review_id, created_at desc);
create index if not exists idx_unmatched_emails_created_at on unmatched_emails(created_at desc);

-- Enable Row Level Security
alter table restaurants enable row level security;
alter table users enable row level security;
alter table reviews enable row level security;
alter table review_actions enable row level security;
alter table unmatched_emails enable row level security;
alter table gmail_credentials enable row level security;
alter table gmail_sync enable row level security;

-- RLS Policies

-- Restaurants: everyone can read
create policy "anyone can read restaurants" on restaurants
  for select using (true);

-- Users: can read own profile
create policy "users read own profile" on users
  for select using (auth.uid() = id);

-- Reviews: owners see all
create policy "owners see all reviews" on reviews
  for select using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'owner')
  );

-- Reviews: managers see own restaurant
create policy "managers see own reviews" on reviews
  for select using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'manager'
        and users.restaurant_id = reviews.restaurant_id
    )
  );

-- Reviews: service role can insert (backend uses service key)
create policy "service insert reviews" on reviews
  for insert with check (true);

-- Reviews: owners can update
create policy "owners update reviews" on reviews
  for update using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'owner')
  );

-- Reviews: managers can update own
create policy "managers update own reviews" on reviews
  for update using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'manager'
        and users.restaurant_id = reviews.restaurant_id
    )
  );

-- Review actions: owners see all
create policy "owners see all actions" on review_actions
  for select using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'owner')
  );

-- Review actions: managers see own restaurant's
create policy "managers see own actions" on review_actions
  for select using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'manager'
        and users.restaurant_id = (select restaurant_id from reviews where reviews.id = review_actions.review_id)
    )
  );

-- Review actions: anyone can insert
create policy "anyone insert actions" on review_actions
  for insert with check (auth.uid() is not null);

-- Unmatched emails: owner only
create policy "owners manage unmatched" on unmatched_emails
  for all using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'owner')
  );

-- Gmail tables: service role access
create policy "service manage gmail" on gmail_credentials for all using (true);
create policy "service manage sync" on gmail_sync for all using (true);
