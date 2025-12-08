-- Add vat_amount column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12, 2) DEFAULT 0;
