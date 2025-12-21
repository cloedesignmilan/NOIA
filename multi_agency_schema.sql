-- MULTI-AGENCY SCHEMA MIGRATION

-- 1. Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'member', 'viewer')) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(user_id, organization_id)
);

-- 2. Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- User can view members of their organizations
CREATE POLICY "Users can view members of their organizations" 
ON organization_members FOR SELECT 
USING (
    user_id = auth.uid() OR 
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

-- Only owners can insert/update/delete members (Simplified: Self-registration handled via API)
-- For now, allow users to see their own memberships strictly or via RPC.
-- Let's keep it simple: Users can read their own memberships.
CREATE POLICY "Users can read own memberships"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

