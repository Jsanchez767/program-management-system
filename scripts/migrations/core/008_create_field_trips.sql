-- Create field trips table for staffs
create table if not exists public.field_trips (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.programs(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  destination text not null,
  trip_date date not null,
  departure_time time,
  return_time time,
  transportation text,
  cost_per_student decimal(10,2),
  max_participants integer,
  educational_objectives text,
  safety_considerations text,
  required_permissions text[],
  status text not null check (status in ('draft', 'submitted', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled')) default 'draft',
  submitted_at timestamp with time zone,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.field_trips enable row level security;

-- RLS policies for field trips
create policy "field_trips_select_own_or_admin"
  on public.field_trips for select
  using (
    staff_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "field_trips_insert_own_staff"
  on public.field_trips for insert
  with check (
    staff_id = auth.uid() and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'staff'
    )
  );

create policy "field_trips_update_own_or_admin"
  on public.field_trips for update
  using (
    staff_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Add updated_at trigger
create trigger field_trips_updated_at
  before update on public.field_trips
  for each row
  execute function public.handle_updated_at();
