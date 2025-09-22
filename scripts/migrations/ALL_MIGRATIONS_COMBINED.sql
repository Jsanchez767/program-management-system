-- COMBINED MIGRATION SCRIPT FOR SUPABASE SQL EDITOR
-- This script includes all core migrations in the correct order
-- Paste this into the Supabase SQL editor to set up your schema

-- 001_create_users_only.sql
-- Basic setup for user authentication
-- All user information is stored in auth.users.raw_user_meta_data
-- Enable necessary extensions
create extension if not exists "uuid-ossp";
-- Grant necessary permissions for auth schema access
grant usage on schema auth to anon, authenticated;
-- Grant access to auth.users for our RPC functions
grant select on auth.users to authenticated;
-- Create helper function for updating timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$     
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;
-- Create a view for user information (optional, for easier queries)
create or replace view public.user_profiles as
select 
  id,
  email,
  raw_user_meta_data ->> 'first_name' as first_name,
  raw_user_meta_data ->> 'last_name' as last_name,
  raw_user_meta_data ->> 'role' as role,
  (raw_user_meta_data ->> 'organization_id')::uuid as organization_id,
  created_at,
  last_sign_in_at
from auth.users
where deleted_at is null;
-- Grant access to the view
grant select on public.user_profiles to authenticated;
-- Note: User metadata structure should be:
-- {
--   "first_name": "John",
--   "last_name": "Doe", 
--   "role": "admin|instructor|student",
--   "organization_id": "uuid-string"
-- }

-- 002_create_programs.sql
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  start_date date,
  end_date date,
  max_participants integer,
  current_participants integer default 0,
  instructor_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('active', 'inactive', 'completed', 'cancelled')) default 'active',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.programs enable row level security;
-- RLS policies for programs
create policy "programs_select_org_metadata"
  on public.programs for select
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "programs_insert_admin_metadata"
  on public.programs for insert
  with check (
    auth.jwt() ->> 'role' = 'admin'
    and organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );
create policy "programs_update_admin_metadata"
  on public.programs for update
  using (
    auth.jwt() ->> 'role' = 'admin'
    and organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );
create policy "programs_delete_admin_metadata"
  on public.programs for delete
  using (
    auth.jwt() ->> 'role' = 'admin'
    and organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );
create trigger programs_updated_at
  before update on public.programs
  for each row
  execute function public.handle_updated_at();

-- 003_create_participants.sql
create table if not exists public.program_participants (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enrollment_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null check (status in ('enrolled', 'completed', 'dropped', 'pending')) default 'enrolled',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(program_id, user_id)
);
-- Enable RLS
alter table public.program_participants enable row level security;
create policy "program_participants_select_org_metadata"
  on public.program_participants for select
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "program_participants_insert_org_metadata"
  on public.program_participants for insert
  with check (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    and auth.jwt() ->> 'role' in ('admin', 'instructor')
  );
create policy "program_participants_update_org_metadata"
  on public.program_participants for update
  using (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    and auth.jwt() ->> 'role' in ('admin', 'instructor')
  );
create policy "program_participants_delete_org_metadata"
  on public.program_participants for delete
  using (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    and auth.jwt() ->> 'role' in ('admin', 'instructor')
  );
create trigger participants_updated_at
  before update on public.program_participants
  for each row
  execute function public.handle_updated_at();

-- 004_create_announcements.sql
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  title text not null,
  content text not null,
  status text not null check (status in ('active', 'inactive')) default 'active',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.announcements enable row level security;
create policy "announcements_select_org"
  on public.announcements for select
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "announcements_insert_org"
  on public.announcements for insert
  with check (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "announcements_update_org"
  on public.announcements for update
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "announcements_delete_org"
  on public.announcements for delete
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create trigger announcements_updated_at
  before update on public.announcements
  for each row
  execute function public.handle_updated_at();

-- 005_create_documents.sql
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  status text not null check (status in ('active', 'inactive')) default 'active',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.documents enable row level security;
create policy "documents_select_org"
  on public.documents for select
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "documents_insert_org"
  on public.documents for insert
  with check (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "documents_update_org"
  on public.documents for update
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "documents_delete_org"
  on public.documents for delete
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create trigger documents_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();

-- 006_create_lesson_plans.sql
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  instructor_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  status text not null check (status in ('active', 'inactive')) default 'active',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.lesson_plans enable row level security;
create policy "lesson_plans_select_org"
  on public.lesson_plans for select
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "lesson_plans_insert_org"
  on public.lesson_plans for insert
  with check (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "lesson_plans_update_org"
  on public.lesson_plans for update
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "lesson_plans_delete_org"
  on public.lesson_plans for delete
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create trigger lesson_plans_updated_at
  before update on public.lesson_plans
  for each row
  execute function public.handle_updated_at();

-- 007_create_purchase_orders.sql
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_date date not null,
  amount numeric(10, 2) not null,
  status text not null check (status in ('pending', 'completed', 'refunded')) default 'pending',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.purchase_orders enable row level security;
create policy "purchase_orders_select_org"
  on public.purchase_orders for select
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "purchase_orders_insert_org"
  on public.purchase_orders for insert
  with check (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "purchase_orders_update_org"
  on public.purchase_orders for update
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "purchase_orders_delete_org"
  on public.purchase_orders for delete
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create trigger purchase_orders_updated_at
  before update on public.purchase_orders
  for each row
  execute function public.handle_updated_at();

-- 008_create_field_trips.sql
create table if not exists public.field_trips (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  location text not null,
  trip_date date not null,
  return_date date,
  status text not null check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.field_trips enable row level security;
create policy "field_trips_select_org"
  on public.field_trips for select
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "field_trips_insert_org"
  on public.field_trips for insert
  with check (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "field_trips_update_org"
  on public.field_trips for update
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create policy "field_trips_delete_org"
  on public.field_trips for delete
  using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
create trigger field_trips_updated_at
  before update on public.field_trips
  for each row
  execute function public.handle_updated_at();

-- 009_create_organizations.sql
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.organizations enable row level security;
create policy "organizations_select_all"
  on public.organizations for select
  using (true);
create policy "organizations_insert_admin"
  on public.organizations for insert
  with check (auth.jwt() ->> 'role' = 'admin');
create policy "organizations_update_admin"
  on public.organizations for update
  using (auth.jwt() ->> 'role' = 'admin');
create policy "organizations_delete_admin"
  on public.organizations for delete
  using (auth.jwt() ->> 'role' = 'admin');
create trigger organizations_updated_at
  before update on public.organizations
  for each row
  execute function public.handle_updated_at();

-- 010_multi_tenant_policies.sql
-- Enable RLS on all relevant tables
alter table public.programs enable row level security;
alter table public.program_participants enable row level security;
alter table public.announcements enable row level security;
alter table public.documents enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.field_trips enable row level security;
alter table public.organizations enable row level security;

-- 011_fix_rls_signup.sql
-- No longer needed, signup is handled via auth.users and metadata

-- 013_user_metadata_rls_policies.sql
-- Enable RLS on auth.users table
-- Supabase manages RLS for auth.users; do not run ALTER TABLE here
create policy "user_metadata_update_own"
  on auth.users for update
  using (id = auth.uid());

-- 015_add_organization_id_to_participants.sql
-- Already handled in program_participants table definition above

-- 016_add_organization_id_to_remaining_tables.sql
-- Already handled in table definitions above

-- 017_add_custom_fields_jsonb.sql
-- Add custom_fields jsonb column to relevant tables
alter table public.programs add column if not exists custom_fields jsonb;
alter table public.program_participants add column if not exists custom_fields jsonb;
alter table public.announcements add column if not exists custom_fields jsonb;
alter table public.documents add column if not exists custom_fields jsonb;
alter table public.lesson_plans add column if not exists custom_fields jsonb;
alter table public.purchase_orders add column if not exists custom_fields jsonb;
alter table public.field_trips add column if not exists custom_fields jsonb;

-- 021_update_rls_for_user_metadata.sql
create policy "user_metadata_select_own"
  on auth.users for select
  using (id = auth.uid());
create policy "user_metadata_update_own"
  on auth.users for update
  using (id = auth.uid());

-- 022_create_instructor_metadata_function.sql
-- Function to get instructors by organization using user metadata
create or replace function get_instructors_for_organization(org_id UUID)
returns table(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    u.id,
    u.raw_user_meta_data ->> 'first_name' as first_name,
    u.raw_user_meta_data ->> 'last_name' as last_name,
    u.email
  from auth.users u
  where 
    u.raw_user_meta_data ->> 'role' = 'instructor'
    and u.raw_user_meta_data ->> 'organization_id' = org_id::text
    and u.deleted_at is null
  order by u.raw_user_meta_data ->> 'first_name';
end;
$$;
grant execute on function get_instructors_for_organization(UUID) to authenticated;

-- 023_migrate_all_user_metadata.sql
-- No longer needed, migration is handled via metadata

-- 024_drop_profiles_table.sql
-- Drop the old profiles table if it exists
-- No longer needed, profiles table is not used
-- END OF MIGRATION
