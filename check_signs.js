require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AZZURRA_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0';

async function run() {
    console.log(`Checking Transaction Signs for Azzurra...`);

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', AZZURRA_ID)
        .limit(10);

    if (!transactions) { console.log('No transactions.'); return; }

    transactions.forEach(t => {
        console.log(`[${t.type}] Amount: ${t.amount} (Status: ${t.status})`);
    });
}

run();
