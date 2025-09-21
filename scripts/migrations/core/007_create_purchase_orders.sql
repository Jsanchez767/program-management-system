-- Create purchase orders table for instructors
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  vendor text,
  total_amount decimal(10,2),
  currency text default 'USD',
  items jsonb, -- Store array of items with details
  justification text,
  status text not null check (status in ('draft', 'submitted', 'approved', 'rejected', 'ordered', 'received')) default 'draft',
  submitted_at timestamp with time zone,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.purchase_orders enable row level security;

-- RLS policies for purchase orders
create policy "purchase_orders_select_own_or_admin"
  on public.purchase_orders for select
  using (
    instructor_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "purchase_orders_insert_own_instructor"
  on public.purchase_orders for insert
  with check (
    instructor_id = auth.uid() and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'instructor'
    )
  );

create policy "purchase_orders_update_own_or_admin"
  on public.purchase_orders for update
  using (
    instructor_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Add updated_at trigger
create trigger purchase_orders_updated_at
  before update on public.purchase_orders
  for each row
  execute function public.handle_updated_at();
