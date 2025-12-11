import { supabase } from '@/lib/supabase';

export async function createAgencyAccount(email: string, password: string, agencyName: string, fullName: string) {
    // 1. Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName }
        }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user created");

    const userId = authData.user.id;

    // 2. Create Organization
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: agencyName, subscription_tier: 'free' }])
        .select()
        .single();

    if (orgError) {
        console.error("Org Creation Error:", orgError);
        // Clean up user if possible or just throw (in prod we'd want a transaction)
        throw new Error("Failed to create organization");
    }

    // 3. Create Profile linked to Org
    const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
            id: userId,
            organization_id: orgData.id,
            full_name: fullName,
            email: email,
            role: 'owner'
        }]);

    if (profileError) {
        console.error("Profile Creation Error:", profileError);
        throw new Error("Failed to create profile");
    }

    return { user: authData.user, org: orgData };
}

export async function signIn(email: string, password: string, rememberMe: boolean = true) {
    // TODO: Implement session persistence toggling based on rememberMe.
    // Currently defaulting to standard Supabase behavior (localStorage).

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}
