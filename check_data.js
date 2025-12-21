require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AGENCY_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0'; // Agenzia Azzurra

async function run() {
    const ORGS = [
        'df829c8f-0476-4b43-aa47-7f99b869050f',
        '2b971887-4ac1-4477-87ca-a6a68a8a47a7',
        '9b076a02-953e-4b84-bfab-8b23e28901c0'
    ];

    for (const id of ORGS) {
        const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', id);
        console.log(`Org ${id}: ${count} transactions`);
    }

    // 3. Count Expenses
    // (Assuming Expenses share transactions table or separate? Let's check schema if needed, but usually trans)
    // If separate table for 'expenses' exists? No, it's usually 'transactions'.
}

run();
