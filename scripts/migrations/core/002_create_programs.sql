-- Create programs table
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  start_date date,
  end_date date,
  max_participants integer,
  current_participants integer default 0,
  staff_id uuid references public.profiles(id) on delete set null,
  status text not null check (status in ('active', 'inactive', 'completed', 'cancelled')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.programs enable row level security;

-- RLS policies for programs
create policy "programs_select_all"
  on public.programs for select
  using (true); -- All authenticated users can view programs

create policy "programs_insert_admin_staff"
  on public.programs for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'staff')
    )
  );

create policy "programs_update_admin_staff"
  on public.programs for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and (role = 'admin' or (role = 'staff' and id = staff_id))
    )
  );

create policy "programs_delete_admin"
  on public.programs for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Add updated_at trigger
create trigger programs_updated_at
  before update on public.programs
  for each row
  execute function public.handle_updated_at();
