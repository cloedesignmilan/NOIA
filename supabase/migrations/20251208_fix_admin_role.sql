-- Set all existing profiles to 'admin' role to ensure they can manage their teams.
-- This is a fix for the initial migration where users might have defaulted to 'agent'.
UPDATE profiles 
SET role = 'admin' 
WHERE role = 'agent' OR role IS NULL;

-- Also update access_level to full_access just in case
UPDATE profiles 
SET access_level = 'full_access' 
WHERE access_level IS NULL OR access_level = 'read_only';
