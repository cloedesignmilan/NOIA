require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AZZURRA_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0';

async function run() {
    console.log(`Checking Transaction Statuses for Azzurra...`);

    const { data: transactions } = await supabase
        .from('transactions')
        .select('status, amount')
        .eq('organization_id', AZZURRA_ID);

    if (!transactions) { console.log('No transactions.'); return; }

    const breakdown = {};
    transactions.forEach(t => {
        const s = t.status || 'null';
        breakdown[s] = (breakdown[s] || 0) + 1;
    });

    console.log('Status Breakdown:', breakdown);
}

run();
