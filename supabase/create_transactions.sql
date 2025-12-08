-- CREAZIONE TABELLA TRANSAZIONI (Se mancante)
-- Esegui questo script per assicurarti che la tabella esista

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL, 
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
  invoice_url TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abilita Sicurezza
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Permessi (Policies)
CREATE POLICY "View transactions of own org" ON transactions
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "Insert transactions for own org" ON transactions
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

-- Grant permessi di base
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE transactions TO service_role;
