-- Add withholding_tax column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS withholding_tax NUMERIC(12, 2) DEFAULT 0;
