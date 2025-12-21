-- FIX: Drop the recursive policy
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

-- Create a simplified policy that avoids recursion
-- This allows users to seeing ONLY their own memberships, which is enough for the Agency Switcher.
CREATE POLICY "Users can view own memberships" 
ON organization_members FOR SELECT 
USING ( user_id = auth.uid() );

-- Note: To see OTHER members (for Team page), we will need a more advanced solution later (e.g. valid_members view).
-- But this solves the immediate "Cannot see agencies dropdown" issue.
