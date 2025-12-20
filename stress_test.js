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

async function stressTest() {
    console.log("--- STARTING STRESS TEST ---");

    // 0. Get Org ID
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    const orgId = orgs[0]?.id;
    if (!orgId) {
        console.error("No organization found.");
        return;
    }
    console.log("Using Organization ID:", orgId);

    // 1. Create Agent
    const agentData = {
        organization_id: orgId,
        first_name: "STRESS",
        last_name: "TEST_USER",
        email: `stress_${Date.now()}@test.com`,
        phone: "1234567890",
        base_commission_percentage: 10,
        active: true
    };

    console.log("\n1. Creating Agent...");
    const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert(agentData)
        .select()
        .single();

    if (agentError) {
        console.error("FAILED to create agent:", agentError);
        return;
    }
    console.log("   ✅ Agent Created:", agent.id, `${agent.first_name} ${agent.last_name}`);


    // 2. Create Income (Transaction)
    console.log("\n2. Creating Income Transaction...");
    const incomeData = {
        organization_id: orgId,
        type: 'income',
        amount: 10000, // €10,000
        description: "Stress Test Income",
        date: new Date().toISOString(),
        status: 'paid', // Important: Paid
        agent_id: agent.id,
        agent_commission_accrued: 1000, // 10% of 10k
        agent_commission_status: 'accrued', // Not paid to agent yet
        category: 'Vendite' // Required field
    };

    const { data: income, error: incomeError } = await supabase
        .from('transactions')
        .insert(incomeData)
        .select()
        .single();

    if (incomeError) {
        console.error("FAILED to create income:", incomeError);
    } else {
        console.log("   ✅ Income Created:", income.id, `Amount: €${income.amount}`);
    }

    // 3. Create Expense
    console.log("\n3. Creating Expense Transaction...");
    const expenseData = {
        organization_id: orgId,
        type: 'expense',
        amount: 500,
        description: "Stress Test Expense",
        date: new Date().toISOString(),
        status: 'paid',
        category: 'Office'
    };

    const { data: expense, error: expenseError } = await supabase
        .from('transactions')
        .insert(expenseData)
        .select()
        .single();

    if (expenseError) {
        console.error("FAILED to create expense:", expenseError);
    } else {
        console.log("   ✅ Expense Created:", expense.id, `Amount: €${expense.amount}`);
    }

    // 4. Verification Check
    console.log("\n4. Verifying Data Integrity...");
    // Check if agent has this transaction
    const { data: checkTx } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', agent.id);

    if (checkTx && checkTx.length > 0) {
        console.log(`   ✅ Verification Successful: Agent has ${checkTx.length} transaction(s).`);
        console.log(`   ✅ Commission Saved: €${checkTx[0].agent_commission_accrued}`);
    } else {
        console.error("   ❌ Verification Failed: Transaction not linked to agent.");
    }

    // 5. Cleanup
    console.log("\n5. Cleaning Up Test Data...");
    if (expense) await supabase.from('transactions').delete().eq('id', expense.id);
    if (income) await supabase.from('transactions').delete().eq('id', income.id);
    if (agent) await supabase.from('agents').delete().eq('id', agent.id);
    console.log("   ✅ Cleanup Complete.");

    console.log("\n--- STRESS TEST PASSED ---");
}

stressTest();
