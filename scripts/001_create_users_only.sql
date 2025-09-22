-- Basic setup for user authentication
-- This script sets up the foundation for the user metadata-based architecture

-- Note: We no longer use a profiles table. All user information is stored in auth.users.raw_user_meta_data
-- This provides better performance and simpler architecture for multi-tenant applications

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

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "profiles_admin_select_all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', null),
    coalesce(new.raw_user_meta_data ->> 'last_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
