-- MASTER SCHEMA FOR NO.IA v.2 (Fresh Install)
-- Run this in the SQL Editor of your NEW Supabase Project

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables
-- Organizations (Tenants)
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free'
);

-- Profiles (Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('owner', 'admin', 'agent', 'accountant')) DEFAULT 'owner',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT,
  type TEXT CHECK (type IN ('residential', 'commercial', 'land', 'other')),
  status TEXT CHECK (status IN ('available', 'under_offer', 'sold', 'rented')) DEFAULT 'available',
  owner_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  listing_price NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL, 
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
  invoice_url TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Helper Function for Org ID
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. RLS Policies (Including the "Fix" for registration)

-- Organizations
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (id = get_auth_org_id());
CREATE POLICY "Enable insert for authenticated users" ON organizations
  FOR INSERT TO authenticated WITH CHECK (true);

-- Profiles
CREATE POLICY "Users can view members of own org" ON profiles
  FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Enable insert for own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- Add update policy just in case
CREATE POLICY "Enable update for own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Clients
CREATE POLICY "View clients of own org" ON clients
  FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Insert clients for own org" ON clients
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

-- Properties
CREATE POLICY "View properties of own org" ON properties
  FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Insert properties for own org" ON properties
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

-- Transactions
CREATE POLICY "View transactions of own org" ON transactions
  FOR SELECT USING (organization_id = get_auth_org_id());
CREATE POLICY "Insert transactions for own org" ON transactions
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());
