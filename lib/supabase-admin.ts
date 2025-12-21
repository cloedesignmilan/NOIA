import { createClient } from '@supabase/supabase-js';

// WARNING: Use this ONLY in Server Components or API Routes.
// NEVER use this on the client side (browser).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Missing SUPABASE_SERVICE_ROLE_KEY. Admin features may fail.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
