-- Add new columns
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS agreed_commission_percentage NUMERIC DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS realized_value NUMERIC DEFAULT 0;

-- Update status constraint to allow 'expired' if necessary, or just rely on text.
-- If there was a constraint, we drop it.
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_status_check CHECK (status IN ('active', 'closed_won', 'closed_lost', 'expired'));
