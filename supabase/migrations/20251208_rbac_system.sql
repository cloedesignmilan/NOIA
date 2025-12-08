-- Add role and access_level to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'agent', -- 'admin', 'agent', 'secretary', 'accountant'
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'full_access'; -- 'read_only', 'full_access'

-- Create team_invites table
CREATE TABLE IF NOT EXISTS team_invites (
    email TEXT PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'agent',
    access_level TEXT NOT NULL DEFAULT 'full_access',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES profiles(id)
);

-- Enable RLS on team_invites
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view/create invites for their org
CREATE POLICY "Admins can view invites for their org" ON team_invites
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role IS NULL) -- Allow NULL for legacy admins (first users)
    ));

CREATE POLICY "Admins can insert invites for their org" ON team_invites
    FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role IS NULL)
    ));
    
CREATE POLICY "Admins can delete invites for their org" ON team_invites
    FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role IS NULL)
    ));

-- Trigger to auto-assign org and role on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_invite()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Check if there is an invite for this email
    SELECT * INTO invite_record FROM public.team_invites WHERE email = new.email;
    
    IF invite_record IS NOT NULL THEN
        -- Link profile to existing org
        UPDATE public.profiles
        SET 
            organization_id = invite_record.organization_id,
            role = invite_record.role,
            access_level = invite_record.access_level
        WHERE id = new.id;
        
        -- Delete the invite after use
        DELETE FROM public.team_invites WHERE email = new.email;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
-- Note: This trigger needs to fire AFTER profile creation. 
-- Assuming existing trigger creates profile on auth.users insert.
-- We can add this trigger on auth.users or profiles. 
-- Better on profiles AFTER INSERT, so the row exists to be updated.
-- WAIT: The standard Supabase pattern often inserts into profiles from auth.users trigger.
-- If we trigger on profiles AFTER INSERT, we can update the SAME row.

DROP TRIGGER IF EXISTS on_profile_created_check_invite ON public.profiles;

CREATE TRIGGER on_profile_created_check_invite
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_invite();
