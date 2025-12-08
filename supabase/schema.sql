-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS (The "Tenant")
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free' -- free, pro, enterprise
);

-- 2. PROFILES (Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('owner', 'admin', 'agent', 'accountant')) DEFAULT 'owner',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLIENTS
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

-- 4. PROPERTIES
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

-- 5. TRANSACTIONS
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

-- RLS POLICIES (Multi-tenancy Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations: Users can view their own org
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (id = get_auth_org_id());

-- Profiles: Users can view profiles in their same org
CREATE POLICY "Users can view members of own org" ON profiles
  FOR SELECT USING (organization_id = get_auth_org_id());

-- Clients: View/Edit only if organization matches
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

-- TRIGGER: Auto-create Profile & Org on Sign Up (Optional but recommended)
-- This logic usually goes in an Edge Function or trigger on auth.users
