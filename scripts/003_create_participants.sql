-- Create program participants table
create table if not exists public.program_participants (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  enrollment_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null check (status in ('enrolled', 'completed', 'dropped', 'pending')) default 'enrolled',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(program_id, student_id)
);

-- Enable RLS
alter table public.program_participants enable row level security;

-- RLS policies for program participants
create policy "participants_select_own_or_admin_instructor"
  on public.program_participants for select
  using (
    student_id = auth.uid() or
    exists (
      select 1 from public.profiles p
      join public.programs pr on pr.instructor_id = p.id
      where p.id = auth.uid() and pr.id = program_id and p.role in ('admin', 'instructor')
    ) or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "participants_insert_admin_instructor"
  on public.program_participants for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'instructor')
    )
  );

create policy "participants_update_admin_instructor"
  on public.program_participants for update
  using (
    exists (
      select 1 from public.profiles p
      join public.programs pr on pr.instructor_id = p.id
      where p.id = auth.uid() and pr.id = program_id and p.role in ('admin', 'instructor')
    ) or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Add updated_at trigger
create trigger participants_updated_at
  before update on public.program_participants
  for each row
  execute function public.handle_updated_at();
