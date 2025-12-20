
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

async function scanAll() {
    console.log("--- SCANNING ALL AGENTS ---");

    // 1. Get all closed assignments
    const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
            *,
            agents (
                first_name,
                last_name
            )
        `)
        .eq('status', 'closed_won');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${assignments.length} TOTAL closed assignments.`);

    for (const a of assignments) {
        // Check for transaction
        const title = a.title || "No Title";
        const agentName = `${a.agents?.first_name} ${a.agents?.last_name}`;

        // Loose match on description
        const { data: txs } = await supabase
            .from('transactions')
            .select('*')
            .eq('agent_id', a.agent_id)
            .ilike('description', `%${a.title}%`);

        const hasTransaction = txs && txs.length > 0;
        const realized = a.realized_value;

        console.log(`\n[${agentName}] Assignment: "${title}"`);
        console.log(`   Realized: €${realized}`);
        console.log(`   Has Transaction? ${hasTransaction ? "YES" : "NO"} (${txs?.length || 0})`);

        if (!hasTransaction && realized > 0) {
            console.log("   ⚠️  MISSING TRANSACTION!");
        } else if (realized === 0) {
            console.log("   ⚠️  REALIZED VALUE IS 0!");
        } else {
            console.log("   ✅ OK");
        }
    }
}

scanAll();
