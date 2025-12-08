-- Add new columns for Invoice and Agent Splits
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS split_agent text,
ADD COLUMN IF NOT EXISTS split_percentage numeric;

-- Comment on columns for clarity
COMMENT ON COLUMN transactions.invoice_number IS 'Number of the issued invoice (optional)';
COMMENT ON COLUMN transactions.split_agent IS 'Name of the agent receiving a commission split';
COMMENT ON COLUMN transactions.split_percentage IS 'Percentage of commission split with the agent';
