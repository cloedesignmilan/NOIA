import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // 1. Verify User Session securely
        // We use a regular client to check the auth token from cookies/headers
        // Or we can just read the header passed by the frontend if we want
        // But better: use the standard pattern if available.
        // For simplicity/speed in this rescue: Read 'Authorization' header.

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Fetch Settings using Admin (Bypass RLS)
        // First get Org
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.organization_id) {
            // If no profile/org, maybe they need setup?
            // Return false so we don't crash
            return NextResponse.json({ completed: true, reason: "No Org" });
        }

        const { data: settings, error: settingsError } = await supabaseAdmin
            .from('agency_settings')
            .select('onboarding_completed, agency_name')
            .eq('organization_id', profile.organization_id)
            .single();

        if (settingsError) {
            // If row missing, assuming onboarding needed
            console.error("Settings fetch error:", settingsError);
            return NextResponse.json({ completed: false, name: '' });
        }

        return NextResponse.json({
            completed: settings.onboarding_completed,
            name: settings.agency_name
        });

    } catch (error: any) {
        console.error("Onboarding Check API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
