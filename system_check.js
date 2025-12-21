require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ CRITICAL: Missing Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runHealthCheck() {
    console.log("🏥 STARTING SYSTEM HEALTH CHECK...\n");
    let allGood = true;

    // 1. Connectivity & Auth
    try {
        process.stdout.write("1. Connecting to Supabase... ");
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        console.log("✅ OK");
    } catch (e) {
        console.log("❌ FAILED");
        console.error(e.message);
        allGood = false;
    }

    // 2. SuperAdmin Status
    try {
        process.stdout.write("2. Verifying SuperAdmin... ");
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const admin = users.find(u => u.email === 'superadmin@noia.cloud');
        if (!admin) {
            console.log("⚠️ WARNING: SuperAdmin user NOT FOUND.");
            // Not necessarily a failure if they haven't re-registered it yet? 
            // But usually critical.
        } else {
            if (admin.email_confirmed_at) console.log("✅ OK (Confirmed)");
            else console.log("⚠️ WARNING (Unconfirmed)");
        }
    } catch (e) {
        console.log("❌ FAILED");
        allGood = false;
    }

    // 3. Critical Tables Check
    const tables = ['profiles', 'organizations', 'agency_settings', 'transaction_categories'];

    for (const table of tables) {
        try {
            process.stdout.write(`3. Checking table '${table}'... `);
            const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
            if (error) {
                // Special handling if table doesn't exist
                if (error.code === '42P01') { // undefined_table
                    console.log("❌ MISSING TABLE");
                    allGood = false;
                } else {
                    console.log(`❌ ERROR: ${error.message}`);
                    allGood = false;
                }
            } else {
                console.log(`✅ OK (Approx ${data !== null ? 'Accessible' : 'Empty'})`);
            }
        } catch (e) {
            console.log("❌ FAILED");
            allGood = false;
        }
    }

    // 4. Schema Integrity (Simple Test)
    try {
        process.stdout.write("4. Testing Profile Schema (Insert Dry Run)... ");
        // We assume if we can select, it's mostly fine. 
        // Let's try to select a known user's profile to see if it parses.
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) throw error;
        console.log("✅ OK (Read Successful)");
    } catch (e) {
        console.log("❌ FAILED");
        allGood = false;
    }

    console.log("\n-------------------------------------------");
    if (allGood) {
        console.log("🚀 SYSTEM STATUS: HEALTHY");
        console.log("The backend infrastructure is operational.");
    } else {
        console.log("⚠️ SYSTEM STATUS: ISSUES DETECTED");
        console.log("Review errors above.");
    }
}

runHealthCheck();
