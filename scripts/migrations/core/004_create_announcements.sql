-- Create announcements table
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_audience text not null check (target_audience in ('all', 'participants', 'staffs', 'program_specific')) default 'all',
  activity_id uuid references public.programs(id) on delete cascade,
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  is_published boolean default false,
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.announcements enable row level security;

-- RLS policies for announcements
create policy "announcements_select_published"
  on public.announcements for select
  using (
    is_published = true and
    (expires_at is null or expires_at > now()) and
    (
      target_audience = 'all' or
      (target_audience = 'participants' and exists (
        select 1 from public.profiles where id = auth.uid() and role = 'participant'
      )) or
      (target_audience = 'staffs' and exists (
        select 1 from public.profiles where id = auth.uid() and role = 'staff'
      )) or
      (target_audience = 'program_specific' and activity_id is not null and exists (
        select 1 from public.program_participants pp
        where pp.participant_id = auth.uid() and pp.activity_id = announcements.activity_id
      ))
    )
  );

create policy "announcements_select_own_or_admin"
  on public.announcements for select
  using (
    author_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "announcements_insert_admin_staff"
  on public.announcements for insert
  with check (
    auth.uid() = author_id and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'staff')
    )
  );

create policy "announcements_update_own_or_admin"
  on public.announcements for update
  using (
    author_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Add updated_at trigger
create trigger announcements_updated_at
  before update on public.announcements
  for each row
  execute function public.handle_updated_at();
