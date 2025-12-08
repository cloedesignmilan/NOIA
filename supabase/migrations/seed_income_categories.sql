-- Seed Defaults for INCOME (Entrate) categories
DO $$
DECLARE
    org RECORD;
BEGIN
    FOR org IN SELECT id FROM organizations LOOP
        -- Intermediazione
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'income', 'intermediazione', '1.1 Comm. Vendita'),
        (org.id, 'income', 'intermediazione', '1.2 Comm. Locazione'),
        (org.id, 'income', 'intermediazione', '1.3 Rinnovo Locaz.');

        -- Servizi
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'income', 'servizi', '2.1 Consulenza'),
        (org.id, 'income', 'servizi', '2.2 Gestione (Rent)'),
        (org.id, 'income', 'servizi', '2.3 Rimb. Marketing');

        -- Flusso
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'income', 'flusso', '3.1 Caparra'),
        (org.id, 'income', 'flusso', '3.2 Incasso Fatture'),
        (org.id, 'income', 'flusso', '3.3 Interessi');

        -- Altro
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'income', 'altro', '4.1 Cessione Beni'),
        (org.id, 'income', 'altro', '4.2 Rimborsi'),
        (org.id, 'income', 'altro', '4.3 Straordinarie');
    END LOOP;
END $$;
