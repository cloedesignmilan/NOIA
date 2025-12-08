-- RIPARAZIONE GENERALE (TRANSAZIONI & PERMESSI)
-- Esegui questo script per sistemare definitivamente l'errore di lettura

-- 1. Assicuriamoci che la funzione "get_auth_org_id" esista e funzioni
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Sistemiamo la tabella TRANSAZIONI
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL, 
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  property_id UUID, -- Rendo opzionali per evitare errori di foreign key se mancano le tabelle collegate
  client_id UUID,
  agent_id UUID,
  status TEXT DEFAULT 'pending',
  invoice_url TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reset dei permessi di Sicurezza (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Cancelliamo le vecchie regole per non fare confusione
DROP POLICY IF EXISTS "View transactions of own org" ON transactions;
DROP POLICY IF EXISTS "Insert transactions for own org" ON transactions;
DROP POLICY IF EXISTS "Enable all access for dev" ON transactions;

-- Nuove regole pulite
CREATE POLICY "View transactions of own org" ON transactions
  FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "Insert transactions for own org" ON transactions
  FOR INSERT WITH CHECK (organization_id = get_auth_org_id());

-- 4. Garantiamo l'accesso all'utente
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE transactions TO service_role;
GRANT EXECUTE ON FUNCTION get_auth_org_id TO authenticated;
