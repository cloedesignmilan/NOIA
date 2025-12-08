-- Add related_transaction_id to link Expense (Split) to Income
ALTER TABLE transactions 
ADD COLUMN related_transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Create an index for performance on lookups
CREATE INDEX idx_transactions_related_id ON transactions(related_transaction_id);
