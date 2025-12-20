
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
    console.log("--- STARTING DATA FIX ---");

    // 1. Find 'closed_won' assignments with 0 realized value
    const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select(`
            *,
            agents (
                base_commission_percentage
            )
        `)
        .eq('status', 'closed_won');

    if (assignError) {
        console.error("Error fetching assignments:", assignError);
        return;
    }

    console.log(`Found ${assignments.length} closed_won assignments.`);

    for (const a of assignments) {
        let realizedVal = a.realized_value;
        let updated = false;

        // FIX 1: If Realized Value is 0, assume Estimated Value
        if (!realizedVal || realizedVal === 0) {
            console.log(`\nAssignment '${a.title}' has 0 Realized Value. Fixing...`);
            realizedVal = a.estimated_value || 0;

            const { error: updateError } = await supabase
                .from('assignments')
                .update({ realized_value: realizedVal })
                .eq('id', a.id);

            if (updateError) console.error("Error updating assignment:", updateError);
            else {
                console.log(`> Updated Realized Value to ${realizedVal}`);
                updated = true;
            }
        }

        // FIX 2: Check if Transaction exists. If not, create it.
        // We look for transactions for this agent around the same date with same amount?
        // Or just blindly create if we think it's missing?
        // Let's matching by description roughly.
        const { data: txs } = await supabase
            .from('transactions')
            .select('*')
            .eq('agent_id', a.agent_id)
            .ilike('description', `%${a.title}%`); // Simple check

        if (!txs || txs.length === 0) {
            console.log(`\nNo transaction found for '${a.title}'. Creating...`);

            const agreedPct = a.agreed_commission_percentage || 0;
            const agencyFee = realizedVal * (agreedPct / 100);

            const agentBase = a.agents?.base_commission_percentage || 0;
            const agentComm = agencyFee * (agentBase / 100);

            if (agencyFee > 0) {
                const { error: txError } = await supabase
                    .from('transactions')
                    .insert([{
                        organization_id: a.organization_id,
                        agent_id: a.agent_id,
                        type: 'income',
                        amount: agencyFee,
                        date: a.end_date || a.acquisition_date || new Date().toISOString(),
                        description: `Provvigione: ${a.title}`,
                        category: 'Intermediazione - Vendita',
                        status: 'pending',
                        agent_commission_accrued: agentComm,
                        agent_commission_status: 'accrued'
                    }]);

                if (txError) console.error("Error creating transaction:", txError);
                else console.log(`> Created Transaction: Income €${agencyFee}, Agent €${agentComm}`);
            } else {
                console.log("> Skipping transaction creation (calculated fee is 0).");
            }
        } else {
            console.log(`Transaction already exists for '${a.title}'. Skipping creation.`);
        }
    }
    console.log("\n--- FIX COMPLETE ---");
}

fixData();
