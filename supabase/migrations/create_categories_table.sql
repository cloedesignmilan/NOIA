-- Create the Categories Table
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    section TEXT CHECK (section IN ('income', 'expense')) NOT NULL,
    macro_category TEXT NOT NULL, -- e.g., 'personale', 'ufficio'
    name TEXT NOT NULL, -- e.g., '1.1 Stipendi'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View own categories" ON transaction_categories 
    FOR SELECT USING (organization_id = get_auth_org_id());

CREATE POLICY "Manage own categories" ON transaction_categories 
    FOR ALL USING (organization_id = get_auth_org_id());

-- Seed Defaults for ALL existing organizations
-- This block loops through all orgs and inserts the default expense categories for them.
DO $$
DECLARE
    org RECORD;
BEGIN
    FOR org IN SELECT id FROM organizations LOOP
        -- Personale
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'expense', 'personale', '1.1 Stipendi e Contributi'),
        (org.id, 'expense', 'personale', '1.2 Provvigioni Agenti Esterni'),
        (org.id, 'expense', 'personale', '1.3 Consulenze Legali/Comm.'),
        (org.id, 'expense', 'personale', '1.4 Formazione');

        -- Ufficio
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'expense', 'ufficio', '2.1 Affitto e Oneri'),
        (org.id, 'expense', 'ufficio', '2.2 Utenze'),
        (org.id, 'expense', 'ufficio', '2.3 Cancelleria'),
        (org.id, 'expense', 'ufficio', '2.4 Pulizia e Manut.');

        -- Marketing
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'expense', 'marketing', '3.1 Portali Immobiliari'),
        (org.id, 'expense', 'marketing', '3.2 Ads Digitali'),
        (org.id, 'expense', 'marketing', '3.3 Stampa e Carta'),
        (org.id, 'expense', 'marketing', '3.4 Foto e Virtual');

        -- Tecnologia
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'expense', 'tecnologia', '4.1 Software e CRM'),
        (org.id, 'expense', 'tecnologia', '4.2 Telecomunicazioni'),
        (org.id, 'expense', 'tecnologia', '4.3 Hardware');

        -- Trasporti
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'expense', 'trasporti', '5.1 Carburante'),
        (org.id, 'expense', 'trasporti', '5.2 Manutenzione Auto'),
        (org.id, 'expense', 'trasporti', '5.3 Viaggi e Trasferte');

        -- Fisco
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'expense', 'fisco', '6.1 Tasse Locali (IMU)'),
        (org.id, 'expense', 'fisco', '6.2 Bolli e Banca'),
        (org.id, 'expense', 'fisco', '6.3 Assicurazioni');

        -- Varie
        INSERT INTO transaction_categories (organization_id, section, macro_category, name) VALUES
        (org.id, 'expense', 'varie', '7.1 Interessi Passivi'),
        (org.id, 'expense', 'varie', '7.2 Indeducibili/Omaggi'),
        (org.id, 'expense', 'varie', '7.3 Rimborsi Caparre');
    END LOOP;
END $$;
