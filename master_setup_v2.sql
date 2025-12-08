-- MASTER SETUP SCRIPT V2 (Schema Fix + Data Seeding)
-- WARNING: This script modifies your database schema AND inserts demo data.

DO $$
DECLARE
  target_org_id uuid;
  agent_mario_id uuid;
  agent_giulia_id uuid;
  agent_luca_id uuid;
BEGIN
  ---------------------------------------------------------
  -- PART 1: APPLY SCHEMA CHANGES (Fix Missing Columns)
  ---------------------------------------------------------
  RAISE NOTICE 'Applying Schema Changes...';

  -- Add 'end_date' if not exists
  BEGIN
    ALTER TABLE assignments ADD COLUMN end_date DATE;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column end_date already exists.';
  END;

  -- Add 'agreed_commission_percentage' if not exists
  BEGIN
    ALTER TABLE assignments ADD COLUMN agreed_commission_percentage NUMERIC DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column agreed_commission_percentage already exists.';
  END;

  -- Add 'realized_value' if not exists
  BEGIN
    ALTER TABLE assignments ADD COLUMN realized_value NUMERIC DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column realized_value already exists.';
  END;

  -- Update status constraint: drop old check and add new one allowing 'expired'
  BEGIN
    ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
    ALTER TABLE assignments ADD CONSTRAINT assignments_status_check CHECK (status IN ('active', 'closed_won', 'closed_lost', 'expired'));
  EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Constraint update warning: %', SQLERRM;
  END;


  ---------------------------------------------------------
  -- PART 2: SEED DEMO DATA
  ---------------------------------------------------------
  RAISE NOTICE 'Starting Data Seeding...';

  -- 1. Get Organization (First found)
  SELECT id INTO target_org_id FROM organizations LIMIT 1;
  
  IF target_org_id IS NULL THEN
    RAISE EXCEPTION 'No Organization found. Please create one first.';
  END IF;

  -- 2. Upsert Agents (Prevent duplicates by email if unique, otherwise just insert)
  -- We'll just insert for now as this is a demo request.
  
  INSERT INTO agents (organization_id, first_name, last_name, role, email, phone, base_commission_percentage)
  VALUES 
  (target_org_id, 'Mario', 'Rossi', 'Socio', 'mario.rossi.demo@example.com', '3331112223', 15.0)
  RETURNING id INTO agent_mario_id;

  INSERT INTO agents (organization_id, first_name, last_name, role, email, phone, base_commission_percentage)
  VALUES 
  (target_org_id, 'Giulia', 'Bianchi', 'Dipendente', 'giulia.bianchi.demo@example.com', '3334445556', 8.0)
  RETURNING id INTO agent_giulia_id;

  INSERT INTO agents (organization_id, first_name, last_name, role, email, phone, base_commission_percentage)
  VALUES 
  (target_org_id, 'Luca', 'Verdi', 'Collaboratore', 'luca.verdi.demo@example.com', '3337778889', 10.0)
  RETURNING id INTO agent_luca_id;

  -- 3. Insert Income Transactions (Last 6 Months)
  -- Mario
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status, agent_id, agent_commission_accrued, agent_commission_status)
  VALUES
  (target_org_id, 'income', 15000.00, CURRENT_DATE - INTERVAL '2 days', 'Vendita Villa Rosa (Rossi)', 'Intermediazione - Vendita', 'paid', agent_mario_id, 2250.00, 'paid'),
  (target_org_id, 'income', 8500.00, CURRENT_DATE - INTERVAL '15 days', 'Vendita App. Centro (Bianchi)', 'Intermediazione - Vendita', 'paid', agent_mario_id, 1275.00, 'accrued'),
  (target_org_id, 'income', 12000.00, CURRENT_DATE - INTERVAL '40 days', 'Vendita Rustico', 'Intermediazione - Vendita', 'paid', agent_mario_id, 1800.00, 'paid'),
  (target_org_id, 'income', 4500.00, CURRENT_DATE - INTERVAL '65 days', 'Affitto Via Roma', 'Intermediazione - Affitto', 'paid', agent_mario_id, 675.00, 'paid');

  -- Giulia
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status, agent_id, agent_commission_accrued, agent_commission_status)
  VALUES
  (target_org_id, 'income', 12000.00, CURRENT_DATE - INTERVAL '5 days', 'Vendita Attico Mare', 'Intermediazione - Vendita', 'paid', agent_giulia_id, 960.00, 'accrued'),
  (target_org_id, 'income', 9000.00, CURRENT_DATE - INTERVAL '35 days', 'Vendita Bilocale', 'Intermediazione - Vendita', 'paid', agent_giulia_id, 720.00, 'paid'),
  (target_org_id, 'income', 3200.00, CURRENT_DATE - INTERVAL '20 days', 'Affitto Estivo', 'Intermediazione - Affitto', 'paid', agent_giulia_id, 256.00, 'paid');

  -- Luca
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status, agent_id, agent_commission_accrued, agent_commission_status)
  VALUES
  (target_org_id, 'income', 25000.00, CURRENT_DATE - INTERVAL '1 month', 'Vendita Complesso Industriale', 'Intermediazione - Vendita', 'paid', agent_luca_id, 2500.00, 'paid'),
  (target_org_id, 'income', 1800.00, CURRENT_DATE - INTERVAL '10 days', 'Consulenza Mutuo', 'Servizi - Consulenza', 'paid', agent_luca_id, 180.00, 'accrued'),
  (target_org_id, 'income', 15000.00, CURRENT_DATE - INTERVAL '3 months', 'Vendita Terreno', 'Intermediazione - Vendita', 'paid', agent_luca_id, 1500.00, 'paid');
  
  -- Random Incomes
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status)
  VALUES
  (target_org_id, 'income', 500.00, CURRENT_DATE - INTERVAL '3 days', 'Registrazione Contratti', 'Servizi - Burocrazia', 'paid'),
  (target_org_id, 'income', 1200.00, CURRENT_DATE - INTERVAL '25 days', 'Valutazioni Immobili', 'Servizi - Valutazione', 'paid');


  -- 4. Insert Expense Transactions (Spread out)
  INSERT INTO transactions (organization_id, type, amount, date, description, category, status)
  VALUES
  (target_org_id, 'expense', -1200.00, CURRENT_DATE - INTERVAL '1 day', 'Affitto Ufficio', 'Ufficio - Affitto', 'paid'),
  (target_org_id, 'expense', -1200.00, CURRENT_DATE - INTERVAL '32 days', 'Affitto Ufficio (Mese Scorso)', 'Ufficio - Affitto', 'paid'),
  (target_org_id, 'expense', -450.00, CURRENT_DATE - INTERVAL '4 days', 'Bolletta Luce', 'Ufficio - Utenze', 'paid'),
  (target_org_id, 'expense', -2500.00, CURRENT_DATE - INTERVAL '10 days', 'Campagna Marketing FB', 'Marketing - Ads', 'paid'),
  (target_org_id, 'expense', -150.00, CURRENT_DATE - INTERVAL '12 days', 'Cancelleria', 'Ufficio - Materiali', 'paid'),
  (target_org_id, 'expense', -800.00, CURRENT_DATE - INTERVAL '20 days', 'Commercialista', 'Consulenza - Fiscale', 'paid'),
  (target_org_id, 'expense', -300.00, CURRENT_DATE - INTERVAL '2 days', 'Pranzo Staff', 'Rappresentanza', 'paid');
    
  -- 5. Insert Assignments (Pipeline) with NEW SCHEMA fields
  -- Mario
  INSERT INTO assignments (organization_id, agent_id, title, status, estimated_value, agreed_commission_percentage, acquisition_date, notes)
  VALUES
  (target_org_id, agent_mario_id, 'Villa Panoramica Collina', 'active', 450000, 3.0, CURRENT_DATE - INTERVAL '10 days', 'Visita in programma'),
  (target_org_id, agent_mario_id, 'Appartamento Centro Storico', 'active', 220000, 2.5, CURRENT_DATE - INTERVAL '5 days', 'Trattativa in corso');

  -- Luca (Closed Won)
  INSERT INTO assignments (organization_id, agent_id, title, status, estimated_value, realized_value, agreed_commission_percentage, acquisition_date, end_date, notes)
  VALUES
  (target_org_id, agent_luca_id, 'Capannone Zona Industriale', 'closed_won', 800000, 780000, 4.0, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '2 days', 'Venduto a logistica');

  -- Giulia (Expired)
  INSERT INTO assignments (organization_id, agent_id, title, status, estimated_value, agreed_commission_percentage, acquisition_date, end_date, notes)
  VALUES
  (target_org_id, agent_giulia_id, 'Monolocale Mare', 'expired', 110000, 3.0, CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '10 days', 'Mandato scaduto, non rinnovato');

  RAISE NOTICE 'Setup Completed Successfully.';

END $$;
