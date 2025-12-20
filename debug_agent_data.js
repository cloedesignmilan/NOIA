
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAgentData() {
    console.log("--- DEBUGGING AGENT DATA ---");

    // 1. Find 'Andrea Bianchi'
    const { data: agents, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .ilike('last_name', '%Bianchi%') // Broad search just in case
        .ilike('first_name', '%Andrea%');

    if (agentError) {
        console.error("Error finding agent:", agentError);
        return;
    }

    if (!agents || agents.length === 0) {
        console.log("No agent found with name like 'Andrea Bianchi'. Listing all agents:");
        const { data: allAgents } = await supabase.from('agents').select('id, first_name, last_name, email');
        console.table(allAgents);
        return;
    }

    const agent = agents[0];
    console.log(`Found Agent: ${agent.first_name} ${agent.last_name} (ID: ${agent.id})`);
    console.log(`Organization ID: ${agent.organization_id}`);

    // 2. Fetch Transactions
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', agent.id)
        .order('date', { ascending: false });

    if (txError) {
        console.error("Error fetching transactions:", txError);
    } else {
        console.log(`\nFound ${transactions.length} Transactions:`);
        transactions.forEach(t => {
            console.log(`- [${t.date}] Type: ${t.type}, Amount: ${t.amount}, CommAccrued: ${t.agent_commission_accrued}, Status: ${t.agent_commission_status}, Desc: ${t.description}`);
        });

        // Quick calc
        const incomeTx = transactions.filter(t => t.type === 'income');
        const totalRev = incomeTx.reduce((acc, t) => acc + (t.amount || 0), 0);
        const totalComm = incomeTx.reduce((acc, t) => acc + (t.agent_commission_accrued || 0), 0);
        console.log(`\n> Calculated Revenue (JS): ${totalRev}`);
        console.log(`> Calculated Commission (JS): ${totalComm}`);
    }

    // 3. Fetch Assignments
    const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .eq('agent_id', agent.id);

    if (assignError) {
        console.error("Error fetching assignments:", assignError);
    } else {
        console.log(`\nFound ${assignments.length} Assignments:`);
        assignments.forEach(a => {
            console.log(`- Title: ${a.title}, Status: ${a.status}, EstVal: ${a.estimated_value}, RealizedVal: ${a.realized_value}, AgreedComm%: ${a.agreed_commission_percentage}, Date: ${a.acquisition_date}`);
        });
    }
}

debugAgentData();
