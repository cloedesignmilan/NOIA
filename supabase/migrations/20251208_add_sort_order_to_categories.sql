-- Add sort_order column to transaction_categories
ALTER TABLE transaction_categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Optional: Initialize sort_order based on name for existing records
-- We can't easily do a row_number update in one simple command without a subquery or join, 
-- but decent default is good enough.
