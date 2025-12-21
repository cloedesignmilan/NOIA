require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const INCOME_CATEGORIES = [
    // 1. Provvigioni
    { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni vendite immobili', sort_order: 10 },
    { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni locazioni', sort_order: 11 },
    { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni affitti turistici', sort_order: 12 },
    { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni affitti di azienda', sort_order: 13 },

    // 2. Collaborazioni
    { section: 'income', macro_category: 'collaborazioni', name: 'Provvigioni da collaborazione inter-agenzia', sort_order: 20 },
    { section: 'income', macro_category: 'collaborazioni', name: 'Segnalazioni clienti', sort_order: 21 },
    { section: 'income', macro_category: 'collaborazioni', name: 'Referral attivi', sort_order: 22 },

    // 3. Servizi
    { section: 'income', macro_category: 'servizi', name: 'Consulenze immobiliari', sort_order: 30 },
    { section: 'income', macro_category: 'servizi', name: 'Valutazioni immobili', sort_order: 31 },
    { section: 'income', macro_category: 'servizi', name: 'Property management', sort_order: 32 },
    { section: 'income', macro_category: 'servizi', name: 'Gestione affitti', sort_order: 33 },
    { section: 'income', macro_category: 'servizi', name: 'Servizi post-vendita', sort_order: 34 },

    // 4. Extra
    { section: 'income', macro_category: 'extra', name: 'Rimborsi spese ricevuti', sort_order: 40 },
    { section: 'income', macro_category: 'extra', name: 'Bonus / incentivi', sort_order: 41 },
    { section: 'income', macro_category: 'extra', name: 'Altri ricavi', sort_order: 42 },
];

async function migrate() {
    console.log('--- STARTING INCOME CATEGORY MIGRATION ---');

    // 1. Get all organizations
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id, name');
    if (orgError) {
        console.error('Error fetching orgs:', orgError);
        return;
    }

    console.log(`Found ${orgs.length} organizations.`);

    for (const org of orgs) {
        console.log(`Processing Org: ${org.name} (${org.id})...`);

        // Check if categories already exist to avoid duplicates
        // Heuristic: Check if 'Provvigioni vendite immobili' exists
        const { data: existing, error: checkError } = await supabase
            .from('transaction_categories')
            .select('id')
            .eq('organization_id', org.id)
            .eq('name', 'Provvigioni vendite immobili')
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`  -> Already migrated. Skipping.`);
            continue;
        }

        // OPTIONAL: Delete old default income categories if desired?
        // Let's keep them or delete? The user wants to OVERRIDE.
        // If we want a clean slate for income, we should delete 'income' section categories first.
        // Safety: Delete only if standard defaults? Or just delete all income?
        // Let's delete ALL income categories for this org to ensure clean slate matching the new UI macros.
        // Otherwise, old categories with old macros (e.g. 'intermediazione') might break the UI or look weird.

        console.log(`  -> Cleaning up old INCOME categories...`);
        const { error: delError } = await supabase
            .from('transaction_categories')
            .delete()
            .eq('organization_id', org.id)
            .eq('section', 'income');

        if (delError) {
            console.error(`  -> DELETE ERROR:`, delError);
            continue;
        }

        // Insert new
        const toInsert = INCOME_CATEGORIES.map(c => ({
            ...c,
            organization_id: org.id
        }));

        const { error: insertError } = await supabase
            .from('transaction_categories')
            .insert(toInsert);

        if (insertError) {
            console.error(`  -> INSERT ERROR:`, insertError);
        } else {
            console.log(`  -> Success! Added ${toInsert.length} categories.`);
        }
    }

    console.log('--- MIGRATION COMPLETE ---');
}

migrate();
