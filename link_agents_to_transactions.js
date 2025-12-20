
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

async function linkAgents() {
    console.log("--- LINKING AGENTS TO TRANSACTIONS ---");

    // 1. Find transactions where split_agent is set BUT agent_id is NULL
    //    OR transactions where transaction type is income and we want to ensure agent_id matches split_agent 
    //    (assuming split_agent is the source of truth for "Collaborazione")

    // Actually, split_agent is a text field (UUID string). agent_id is UUID.
    // We just want to sync them.

    const { data: txs, error } = await supabase
        .from('transactions')
        .select('*')
        .not('split_agent', 'is', null);

    if (error) {
        console.error("Error fetching transactions:", error);
        return;
    }

    console.log(`Found ${txs.length} transactions with a designated split agent.`);

    let validFormatCount = 0;

    // Helper to check if string is UUID
    const isUUID = (str) => {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(str);
    };

    for (const t of txs) {
        const splitId = t.split_agent;

        // 2. Validate it looks like a UUID
        if (!isUUID(splitId)) {
            console.log(`Skipping Tx ${t.id}: split_agent '${splitId}' is not a valid UUID.`);
            continue;
        }

        validFormatCount++;

        // 3. Calculate Commission if missing (optional, but good for cleanup)
        // We need the percentage.
        const pct = t.split_percentage || 0;
        const incomeVal = t.amount || 0;
        let accrued = t.agent_commission_accrued;

        // Recalculate if it's 0 or null
        if (!accrued || accrued === 0) {
            accrued = (Math.abs(incomeVal) * pct) / 100;
        }

        // 4. Update
        if (t.agent_id !== splitId || t.agent_commission_accrued !== accrued) {
            console.log(`Updating Tx ${t.id} -> Agent: ${splitId}, Comm: ${accrued}`);

            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    agent_id: splitId,
                    agent_commission_accrued: accrued,
                    agent_commission_status: t.agent_commission_status || 'accrued'
                })
                .eq('id', t.id);

            if (updateError) console.error("Update failed:", updateError);
            else console.log("   ✅ Success");
        } else {
            console.log(`Tx ${t.id} is already correct.`);
        }
    }

    console.log(`\n--- SYNC COMPLETE (Processed ${validFormatCount} valid records) ---`);
}

linkAgents();
