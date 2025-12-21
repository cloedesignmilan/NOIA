require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL = 'immobiliare@me.com';
const PASSWORD = 'password123';
const AZZURRA_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0';

async function run() {
    console.log(`Checking Context & RLS for: ${EMAIL}...`);

    // 1. Log in
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (loginError) { console.error('Login Failed:', loginError.message); return; }
    const userId = session.user.id;
    console.log(`Logged in. User ID: ${userId}`);

    // 2. Check Profile (Active Context)
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();
    console.log(`Current Active Org in Profile: ${profile.organization_id}`);

    if (profile.organization_id !== AZZURRA_ID) {
        console.log(`⚠️ User is NOT pointing to Azzurra (${AZZURRA_ID}). They are seeing empty data from another org.`);
    } else {
        console.log(`✅ User IS pointing to Azzurra.`);

        // 3. Try fetching transactions as User (Test RLS)
        const { data: trans, error: transError, count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true });

        if (transError) console.error('RLS Blocked Transaction Fetch:', transError);
        else console.log(`Visible Transactions (RLS Check): ${count}`);
    }
}

run();
