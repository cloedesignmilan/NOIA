-- Add tax_regime to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS tax_regime TEXT DEFAULT 'forfettario' CHECK (tax_regime IN ('forfettario', 'ordinario'));
