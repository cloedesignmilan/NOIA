-- Allow users to view details of ALL organizations they belong to
CREATE POLICY "Users can view organizations they belong to" 
ON organizations FOR SELECT 
USING (
    id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);
