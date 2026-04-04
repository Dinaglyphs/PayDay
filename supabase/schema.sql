-- ============================================================
-- PayDay by Dinaglyphs — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists preferences (
  id       uuid default gen_random_uuid() primary key,
  user_id  uuid references auth.users(id) on delete cascade not null,
  key      text not null,
  value    text not null,
  unique(user_id, key)
);

create table if not exists template_bills (
  id         text primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null default '',
  budgeted   real not null default 0,
  category   text not null default '',
  sort_order integer not null default 0
);

create table if not exists template_debts (
  id               text primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  name             text not null default '',
  type             text not null default '',
  starting_balance real not null default 0
);

create table if not exists cycles (
  id           text primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         text,
  paycheck     real default 0,
  other_income real default 0,
  total_income real default 0,
  is_active    integer not null default 0,
  status       text default 'closed',
  closed_at    text,
  created_at   timestamptz default now()
);

create table if not exists cycle_bills (
  id         text primary key,
  cycle_id   text references cycles(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text default '',
  category   text default '',
  budgeted   real default 0,
  actual     real default 0,
  status     text default 'untouched',
  sort_order integer default 0
);

create table if not exists cycle_debt_payments (
  id          text primary key,
  cycle_id    text references cycles(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  debt_id     text default '',
  debt_name   text default '',
  amount_paid real default 0
);

create table if not exists cycle_debt_snapshots (
  id       text primary key,
  cycle_id text references cycles(id) on delete cascade not null,
  user_id  uuid references auth.users(id) on delete cascade not null,
  debt_id  text default '',
  name     text default '',
  balance  real default 0
);

create table if not exists payslips (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  month         integer not null,
  year          integer not null,
  filename      text not null,
  original_name text default '',
  uploaded_at   text not null
);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table preferences          enable row level security;
alter table template_bills       enable row level security;
alter table template_debts       enable row level security;
alter table cycles               enable row level security;
alter table cycle_bills          enable row level security;
alter table cycle_debt_payments  enable row level security;
alter table cycle_debt_snapshots enable row level security;
alter table payslips             enable row level security;

-- Each user can only read and write their own rows

create policy "Own preferences"          on preferences          for all using (auth.uid() = user_id);
create policy "Own template_bills"       on template_bills       for all using (auth.uid() = user_id);
create policy "Own template_debts"       on template_debts       for all using (auth.uid() = user_id);
create policy "Own cycles"               on cycles               for all using (auth.uid() = user_id);
create policy "Own cycle_bills"          on cycle_bills          for all using (auth.uid() = user_id);
create policy "Own cycle_debt_payments"  on cycle_debt_payments  for all using (auth.uid() = user_id);
create policy "Own cycle_debt_snapshots" on cycle_debt_snapshots for all using (auth.uid() = user_id);
create policy "Own payslips"             on payslips             for all using (auth.uid() = user_id);

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Run this block separately if the bucket doesn't already exist

insert into storage.buckets (id, name, public)
values ('payslips', 'payslips', false)
on conflict (id) do nothing;

-- Storage RLS: users can only access files in their own folder (uid/filename)
create policy "Own payslip files" on storage.objects
  for all using (
    bucket_id = 'payslips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
