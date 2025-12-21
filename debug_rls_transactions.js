require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL = 'immobiliare@me.com';
const PASSWORD = 'password123';
const AZZURRA_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0'; // Has 23 transactions
const FIRENZE_ID = '2b971887-4ac1-4477-87ca-a6a68a8a47a7';   // Empty

async function run() {
    console.log(`Testing Cross-Org RLS for: ${EMAIL}...`);

    // 1. Log in
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (loginError) { console.error('Login Failed:', loginError.message); return; }
    console.log(`Logged in.`);

    // 2. SWITCH Context to "Firenze" (Empty one)
    // We do this via the API simulation or just by updating profile?
    // Client usually relies on Profile content for RLS? Or does RLS check profile?
    // Most standard RLS checks profile. let's update profile to Firenze.

    // We need service role to force profile update without restrictions if RLS prevents it? 
    // No, user can usually update their own profile.

    const { error: switchError } = await supabase
        .from('profiles')
        .update({ organization_id: FIRENZE_ID })
        .eq('id', session.user.id);

    if (switchError) console.error('Switch Error:', switchError);
    else console.log(`Switched context to Firenze (${FIRENZE_ID})`);

    // 3. Try to fetch transactions from AZZURRA (Should be 23)
    console.log("Attempting to fetch Azzurra transactions...");
    const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', AZZURRA_ID);

    if (error) console.error('Fetch Error:', error);

    console.log(`Transactions visible from Firenze context: ${count}`);

    if (count === 0) {
        console.log("❌ RLS IS BLOCKING cross-org reads.");
    } else {
        console.log("✅ RLS allows cross-org reads.");
    }

    // Restore context
    await supabase.from('profiles').update({ organization_id: AZZURRA_ID }).eq('id', session.user.id);
    console.log("Restored context to Azzurra.");
}

run();
