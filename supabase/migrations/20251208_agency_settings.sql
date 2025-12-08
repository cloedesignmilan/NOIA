-- Create agency_settings table
CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  agency_name TEXT NOT NULL,
  address TEXT,
  vat_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  tax_regime TEXT CHECK (tax_regime IN ('forfettario', 'ordinario')) DEFAULT 'ordinario',
  default_vat_rate NUMERIC DEFAULT 22,
  revenue_limit NUMERIC DEFAULT 85000,
  fiscal_year_start TEXT DEFAULT '01-01',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View agency settings of own org" ON agency_settings
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "Insert agency settings for own org" ON agency_settings
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

CREATE POLICY "Update agency settings for own org" ON agency_settings
  FOR UPDATE USING (organization_id = get_auth_org_id());
