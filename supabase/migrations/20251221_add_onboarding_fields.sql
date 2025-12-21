-- Add Onboarding and Goal columns to agency_settings

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_settings' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE agency_settings ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_settings' AND column_name = 'target_annual_revenue') THEN
        ALTER TABLE agency_settings ADD COLUMN target_annual_revenue NUMERIC DEFAULT 0;
    END IF;
END $$;
