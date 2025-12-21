import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();
        console.log("[Onboarding API] Body:", JSON.stringify(body, null, 2));

        const { agencyData, agentData } = body;

        // 1. Get Org ID
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const orgId = profile.organization_id;
        console.log("[Onboarding API] Updating Org:", orgId);

        // 2. Insert/Update Settings (Admin Bypass)
        // Use UPSERT to handle missing rows
        const updatePayload = {
            organization_id: orgId,
            agency_name: agencyData.name,
            vat_code: agencyData.vat,
            address: agencyData.address,
            tax_regime: agencyData.regime,
            target_annual_revenue: parseFloat(agencyData.goalAnnual) || 0,
            onboarding_completed: true
        };
        console.log("[Onboarding API] Payload:", updatePayload);

        const { data: updatedData, error: settingsError } = await supabaseAdmin
            .from('agency_settings')
            .upsert(updatePayload, { onConflict: 'organization_id' })
            .select();

        if (settingsError) {
            console.error("[Onboarding API] Settings Upsert Error:", settingsError);
            throw new Error("Failed to save settings: " + settingsError.message);
        }

        console.log("[Onboarding API] Update Success:", updatedData);

        // 3. Create First Agent (Optional)
        if (agentData?.firstName && agentData?.lastName) {
            // Basic agent creation logic
            console.log("[Onboarding API] Attempting to create agent...");
            const email = agentData.email || `agent-${Date.now()}@temp.com`;
            const password = `Agent${Date.now()}!`;

            try {
                // Check if user exists first to allow multiple retries without error
                const { data: existingUser } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();

                if (!existingUser) {
                    const { data: newAgentAuth } = await supabaseAdmin.auth.admin.createUser({
                        email: email,
                        password: password,
                        email_confirm: true,
                        user_metadata: { full_name: `${agentData.firstName} ${agentData.lastName}` }
                    });

                    if (newAgentAuth?.user) {
                        await supabaseAdmin.from('profiles').insert([{
                            id: newAgentAuth.user.id,
                            organization_id: orgId,
                            full_name: `${agentData.firstName} ${agentData.lastName}`,
                            email: email,
                            role: agentData.role || 'agente_senior',
                            access_level: 'basic_access'
                        }]);
                        console.log("Agent Created!");
                    }
                } else {
                    console.log("Agent email already exists, skipping creation");
                }
            } catch (agentErr) {
                console.error("Agent creation warning:", agentErr);
            }
        }

        return NextResponse.json({ success: true, updated: updatedData });

    } catch (error: any) {
        console.error("[Onboarding API] Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
