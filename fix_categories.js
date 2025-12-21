require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DEFAULTS = [
    // INCOME
    { section: 'income', macro: 'intermediazione', name: '1.1 Comm. Vendita' },
    { section: 'income', macro: 'intermediazione', name: '1.2 Comm. Locazione' },
    { section: 'income', macro: 'intermediazione', name: '1.3 Rinnovo Locaz.' },
    { section: 'income', macro: 'servizi', name: '2.1 Consulenza' },
    { section: 'income', macro: 'servizi', name: '2.2 Gestione (Rent)' },
    { section: 'income', macro: 'servizi', name: '2.3 Rimb. Marketing' },
    { section: 'income', macro: 'flusso', name: '3.1 Caparra' },
    { section: 'income', macro: 'flusso', name: '3.2 Incasso Fatture' },
    { section: 'income', macro: 'altro', name: '4.1 Cessione Beni' },
    { section: 'income', macro: 'altro', name: '4.2 Straordinarie' },

    // EXPENSE
    { section: 'expense', macro: 'personale', name: '1.1 Stipendi e Contributi' },
    { section: 'expense', macro: 'personale', name: '1.2 Provvigioni Agenti Esterni' },
    { section: 'expense', macro: 'personale', name: '1.3 Consulenze Legali/Comm.' },
    { section: 'expense', macro: 'ufficio', name: '2.1 Affitto e Oneri' },
    { section: 'expense', macro: 'ufficio', name: '2.2 Utenze' },
    { section: 'expense', macro: 'ufficio', name: '2.3 Cancelleria' },
    { section: 'expense', macro: 'marketing', name: '3.1 Portali Immobiliari' },
    { section: 'expense', macro: 'marketing', name: '3.2 Ads Digitali' },
    { section: 'expense', macro: 'tecnologia', name: '4.1 Software e CRM' },
    { section: 'expense', macro: 'trasporti', name: '5.1 Carburante' },
    { section: 'expense', macro: 'fisco', name: '6.1 Tasse Locali (IMU)' },
    { section: 'expense', macro: 'varie', name: '7.1 Interessi Passivi' },
];

async function fixCategories(email) {
    console.log(`Fixing categories for: ${email}`);

    // 1. Get User
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) { console.log("User not found"); return; }

    // 2. Get Org
    const { data: profile } = await supabaseAdmin.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) { console.log("Profile missing"); return; }
    console.log(`Org ID: ${profile.organization_id}`);

    // 3. Insert Defaults
    const rows = DEFAULTS.map((d, i) => ({
        organization_id: profile.organization_id,
        section: d.section,
        macro_category: d.macro,
        name: d.name
        // sort_order removed
    }));

    const { error } = await supabaseAdmin.from('transaction_categories').insert(rows);

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log(`SUCCESS! Inserted ${rows.length} categories.`);
    }
}

fixCategories('test7@agenzia.com');
