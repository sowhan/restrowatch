-- RestroWatch Schema

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
  resolved_at timestamptz,
  first_viewed_at timestamptz,
  first_action_at timestamptz,
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
  access_token text,
  refresh_token text,
  last_history_id text,
  last_synced_at timestamptz default now()
);

-- Unmatched emails
create table if not exists unmatched_emails (
  id uuid primary key default gen_random_uuid(),
  email_subject text,
  email_body text,
  email_message_id text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_reviews_restaurant_id on reviews(restaurant_id);
create index if not exists idx_reviews_status on reviews(status);
create index if not exists idx_reviews_severity on reviews(severity);
create index if not exists idx_reviews_detected_at on reviews(detected_at);
create index if not exists idx_review_actions_review_id on review_actions(review_id);
create index if not exists idx_users_role on users(role);

-- Enable Realtime
alter publication supabase_realtime add table reviews;
alter publication supabase_realtime add table review_actions;

-- RLS Policies
alter table restaurants enable row level security;
alter table users enable row level security;
alter table reviews enable row level security;
alter table review_actions enable row level security;

-- Owners can see all restaurants
create policy "owners can read all restaurants" on restaurants
  for select using (
    auth.uid() in (select id from users where role = 'owner')
    or auth.uid() in (select id from users where id = auth.uid())
  );

-- Managers can read restaurants
create policy "users can read own data" on users
  for select using (auth.uid() = id);

-- Reviews: owners can read all, managers only theirs
create policy "owners can read all reviews" on reviews
  for select using (
    auth.uid() in (select id from users where role = 'owner')
  );

create policy "managers can read their reviews" on reviews
  for select using (
    restaurant_id in (
      select restaurant_id from users where id = auth.uid()
    )
  );

-- Actions: owners can read all, managers only theirs
create policy "owners can read all actions" on review_actions
  for select using (
    auth.uid() in (select id from users where role = 'owner')
  );

create policy "managers can read their actions" on review_actions
  for select using (
    review_id in (
      select id from reviews where restaurant_id in (
        select restaurant_id from users where id = auth.uid()
      )
    )
  );
