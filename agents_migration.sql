-- 1. Create Agents Table
create table if not exists agents (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) not null,
  first_name text not null,
  last_name text not null,
  role text default 'Collaboratore', -- e.g., Dipendente, P.IVA
  email text,
  phone text,
  tax_code text, -- Codice Fiscale
  vat_number text, -- Partita IVA
  base_commission_percentage numeric default 10.0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Assignments Table (Pipeline)
create table if not exists assignments (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) not null,
  agent_id uuid references agents(id),
  title text not null, -- Property address or internal code
  status text default 'active', -- 'active', 'closed_won', 'closed_lost'
  estimated_value numeric,
  acquisition_date date default CURRENT_DATE,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Update Transactions Table
alter table transactions 
add column if not exists agent_id uuid references agents(id),
add column if not exists agent_commission_accrued numeric default 0,
add column if not exists agent_commission_status text default 'accrued'; -- 'accrued', 'paid'

-- 4. Enable Row Level Security (RLS)

-- Agents Policies
alter table agents enable row level security;

-- Policy: Users can view agents if they belong to the same organization
create policy "Users can view agents in their organization" on agents
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Users can insert agents in their organization" on agents
  for insert with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Users can update agents in their organization" on agents
  for update using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Users can delete agents in their organization" on agents
  for delete using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

-- Assignments Policies
alter table assignments enable row level security;

create policy "Users can view assignments in their organization" on assignments
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Users can insert assignments in their organization" on assignments
  for insert with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Users can update assignments in their organization" on assignments
  for update using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Users can delete assignments in their organization" on assignments
  for delete using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );
