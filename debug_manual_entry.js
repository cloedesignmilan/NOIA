
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentTransactions() {
    console.log("--- CHECKING RECENT TRANSACTIONS ---");

    // Get last 5 income transactions
    const { data: txs, error } = await supabase
        .from('transactions')
        .select(`
            id, 
            date, 
            amount, 
            description, 
            agent_id, 
            agent_commission_accrued,
            split_agent
        `)
        .eq('type', 'income')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (txs.length === 0) {
        console.log("No recent income transactions found.");
        return;
    }

    console.log(`Found ${txs.length} recent transactions:`);
    txs.forEach(t => {
        console.log(`\n[${t.date}] Desc: ${t.description}`);
        console.log(`   Amount: €${t.amount}`);
        console.log(`   Agent ID Linked: ${t.agent_id || 'NULL'} (Should match split agent?)`);
        console.log(`   Split Agent Field: ${t.split_agent || 'NULL'}`);
        console.log(`   Commission Accrued: €${t.agent_commission_accrued}`);

        if (!t.agent_id && t.split_agent) {
            console.log("   ❌ ERROR: split_agent is set but agent_id is NULL. Agent Dashboard won't see this.");
        } else if (t.agent_id) {
            console.log("   ✅ OK: agent_id is set.");
        }
    });
}

checkRecentTransactions();
