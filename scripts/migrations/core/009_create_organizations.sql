-- Create organizations table for multi-tenancy
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text unique not null,
  admin_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.organizations enable row level security;

-- Add organization_id to profiles table
alter table public.profiles 
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- Add organization_id to programs table  
alter table public.programs
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- Create invitations table for workspace invites
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'staff', 'participant')) default 'participant',
  status text not null check (status in ('pending', 'accepted', 'expired')) default 'pending',
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamp with time zone default (now() + interval '7 days'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, email)
);

-- Enable RLS
alter table public.invitations enable row level security;

-- Create function to handle organization creation during signup
create or replace function public.handle_new_user_organization()
returns trigger as $$
begin
  -- This function will be called by the application logic, not a trigger
  -- since we need more control over the organization creation process
  return new;
end;
$$ language plpgsql security definer;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.organizations to anon, authenticated;
grant all on public.invitations to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.programs to anon, authenticated;