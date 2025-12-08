-- Robust migration to ensure base_commission_percentage exists

-- 1. If commission_percentage exists (legacy/mistake), rename it to base_commission_percentage
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'commission_percentage'
    ) THEN
        ALTER TABLE agents RENAME COLUMN commission_percentage TO base_commission_percentage;
    END IF;
END $$;

-- 2. If it still doesn't exist (neither existed), add it
ALTER TABLE agents ADD COLUMN IF NOT EXISTS base_commission_percentage NUMERIC DEFAULT 10;
