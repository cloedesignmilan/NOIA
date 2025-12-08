-- Add base_commission_percentage to agents table (Rename from commission_percentage to match legacy code)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS base_commission_percentage NUMERIC DEFAULT 10;
