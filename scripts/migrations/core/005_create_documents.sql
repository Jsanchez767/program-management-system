-- Create documents table for student document submissions
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  file_url text,
  file_type text,
  file_size integer,
  student_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  document_type text not null check (document_type in ('enrollment', 'medical', 'emergency_contact', 'photo_release', 'other')) default 'other',
  status text not null check (status in ('pending', 'approved', 'rejected', 'missing')) default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamp with time zone,
  notes text,
  is_required boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.documents enable row level security;

-- RLS policies for documents
create policy "documents_select_own_or_admin_instructor"
  on public.documents for select
  using (
    student_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'instructor')
    )
  );

create policy "documents_insert_own"
  on public.documents for insert
  with check (
    student_id = auth.uid() and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'student'
    )
  );

create policy "documents_update_own_or_admin"
  on public.documents for update
  using (
    student_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'instructor')
    )
  );

-- Add updated_at trigger
create trigger documents_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();
