-- SEED DATA SCRIPT
-- WARNING: This script inserts data into your database.
-- It attempts to find your Organization ID automatically.

DO $$
DECLARE
  target_org_id uuid;
  agent_mario_id uuid;
  agent_giulia_id uuid;
  agent_luca_id uuid;
BEGIN
  -- 1. Get the first organization found (Modify this if you want a specific Org)
  SELECT id INTO target_org_id FROM organizations LIMIT 1;
  
  IF target_org_id IS NULL THEN
    RAISE EXCEPTION 'No Organization found. Please create one first.';
  END IF;

  -- 2. Insert Agents
  INSERT INTO agents (organization_id, first_name, last_name, role, email, phone, base_commission_percentage)
  VALUES 
  (target_org_id, 'Mario', 'Rossi', 'Socio', 'mario.rossi@example.com', '3331112223', 15.0)
  RETURNING id INTO agent_mario_id;

  INSERT INTO agents (organization_id, first_name, last_name, role, email, phone, base_commission_percentage)
  VALUES 
  (target_org_id, 'Giulia', 'Bianchi', 'Dipendente', 'giulia.bianchi@example.com', '3334445556', 8.0)
  RETURNING id INTO agent_giulia_id;

  INSERT INTO agents (organization_id, first_name, last_name, role, email, phone, base_commission_percentage)
  VALUES 
  (target_org_id, 'Luca', 'Verdi', 'Collaboratore', 'luca.verdi@example.com', '3337778889', 10.0)
  RETURNING id INTO agent_luca_id;

  -- 3. Insert Income Transactions (Linked to Agents)
  -- Mario's Sales
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status, agent_id, agent_commission_accrued, agent_commission_status)
  VALUES
  (target_org_id, 'income', 15000.00, CURRENT_DATE - INTERVAL '2 days', 'Vendita Villa Rosa (Rossi)', 'Intermediazione - Vendita', 'paid', agent_mario_id, 2250.00, 'paid'),
  (target_org_id, 'income', 8500.00, CURRENT_DATE - INTERVAL '15 days', 'Vendita App. Centro (Bianchi)', 'Intermediazione - Vendita', 'paid', agent_mario_id, 1275.00, 'accrued'),
  (target_org_id, 'income', 4500.00, CURRENT_DATE - INTERVAL '45 days', 'Affitto Via Roma', 'Intermediazione - Affitto', 'paid', agent_mario_id, 675.00, 'paid');

  -- Giulia's Sales
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status, agent_id, agent_commission_accrued, agent_commission_status)
  VALUES
  (target_org_id, 'income', 12000.00, CURRENT_DATE - INTERVAL '5 days', 'Vendita Attico Mare', 'Intermediazione - Vendita', 'paid', agent_giulia_id, 960.00, 'accrued'),
  (target_org_id, 'income', 3200.00, CURRENT_DATE - INTERVAL '20 days', 'Affitto Estivo', 'Intermediazione - Affitto', 'paid', agent_giulia_id, 256.00, 'paid');

  -- Luca's Sales
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status, agent_id, agent_commission_accrued, agent_commission_status)
  VALUES
  (target_org_id, 'income', 25000.00, CURRENT_DATE - INTERVAL '1 month', 'Vendita Complesso Industriale', 'Intermediazione - Vendita', 'paid', agent_luca_id, 2500.00, 'paid'),
  (target_org_id, 'income', 1800.00, CURRENT_DATE - INTERVAL '10 days', 'Consulenza Mutuo', 'Servizi - Consulenza', 'paid', agent_luca_id, 180.00, 'accrued');
  
  -- Random other incomes
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status)
  VALUES
  (target_org_id, 'income', 500.00, CURRENT_DATE - INTERVAL '3 days', 'Registrazione Contratti', 'Servizi - Burocrazia', 'paid'),
  (target_org_id, 'income', 1200.00, CURRENT_DATE - INTERVAL '25 days', 'Valutazioni Immobili', 'Servizi - Valutazione', 'paid');


  -- 4. Insert Expense Transactions
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status)
  VALUES
  (target_org_id, 'expense', -1200.00, CURRENT_DATE - INTERVAL '1 day', 'Affitto Ufficio', 'Ufficio - Affitto', 'paid'),
  (target_org_id, 'expense', -450.00, CURRENT_DATE - INTERVAL '4 days', 'Bolletta Luce', 'Ufficio - Utenze', 'paid'),
  (target_org_id, 'expense', -2500.00, CURRENT_DATE - INTERVAL '10 days', 'Campagna Marketing FB', 'Marketing - Ads', 'paid'),
  (target_org_id, 'expense', -150.00, CURRENT_DATE - INTERVAL '12 days', 'Cancelleria', 'Ufficio - Materiali', 'paid'),
  (target_org_id, 'expense', -800.00, CURRENT_DATE - INTERVAL '20 days', 'Commercialista', 'Consulenza - Fiscale', 'paid'),
  (target_org_id, 'expense', -300.00, CURRENT_DATE - INTERVAL '2 days', 'Pranzo Staff', 'Rappresentanza', 'paid');
    
  -- 5. Insert Assignments (Pipeline) for Agents
  INSERT INTO assignments (organization_id, agent_id, title, status, estimated_value, notes)
  VALUES
  (target_org_id, agent_mario_id, 'Villa Panoramica Collina', 'active', 450000, 'Visita in programma'),
  (target_org_id, agent_mario_id, 'Appartamento Centro Storico', 'active', 220000, 'Trattativa in corso'),
  (target_org_id, agent_giulia_id, 'Monolocale Mare', 'active', 110000, 'Nuova acquisizione'),
  (target_org_id, agent_luca_id, 'Capannone Zona Industriale', 'closed_won', 800000, 'Venduto a logistica');

END $$;
