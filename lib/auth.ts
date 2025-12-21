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
    console.log("Creating Organization:", agencyName);
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: agencyName, subscription_tier: 'free' }])
        .select()
        .single();

    if (orgError) {
        console.error("Org Creation Error Details:", orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // 3. Create Profile linked to Org
    console.log("Creating Profile for User:", userId, "Org:", orgData.id);
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
        console.error("Profile Creation Error Details:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
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
