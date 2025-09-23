-- Create lesson plans table for staffs
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.programs(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  lesson_date date not null,
  duration_minutes integer,
  objectives text[],
  materials_needed text[],
  activities text,
  notes text,
  status text not null check (status in ('draft', 'published', 'completed')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.lesson_plans enable row level security;

-- RLS policies for lesson plans
create policy "lesson_plans_select_own_or_admin"
  on public.lesson_plans for select
  using (
    staff_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "lesson_plans_insert_own_staff"
  on public.lesson_plans for insert
  with check (
    staff_id = auth.uid() and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'staff'
    )
  );

create policy "lesson_plans_update_own_or_admin"
  on public.lesson_plans for update
  using (
    staff_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Add updated_at trigger
create trigger lesson_plans_updated_at
  before update on public.lesson_plans
  for each row
  execute function public.handle_updated_at();
