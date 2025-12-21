import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    let createdUserId: string | null = null;
    let createdOrgId: string | null = null;

    try {
        const { email, password, agencyName, fullName } = await req.json();

        // 1. Create User with Auto-Confirm (Admin)
        // Note: verified email is crucial for certain RLS policies
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            console.error("Admin CreateUser Error:", authError);
            throw authError; // No rollback needed yet
        }

        const user = authData.user;
        if (!user) throw new Error("User creation failed (no data)");

        createdUserId = user.id; // Mark for potential rollback
        console.log(`[REGISTER] User created: ${user.id}`);

        // 2. Create Organization
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert([{ name: agencyName, subscription_tier: 'free' }])
            .select()
            .single();

        if (orgError) throw new Error(`Org Creation Failed: ${orgError.message}`);
        createdOrgId = orgData.id; // Could rollback org too if needed, but cascade might handle user

        // 3. Create Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{
                id: user.id,
                organization_id: orgData.id,
                full_name: fullName,
                email: email,
                role: 'owner'
            }]);

        if (profileError) throw new Error(`Profile Creation Failed: ${profileError.message}`);

        // 4. Create Settings (Force Onboarding)
        const { error: settingsError } = await supabaseAdmin.from('agency_settings').insert([{
            organization_id: orgData.id,
            agency_name: agencyName,
            onboarding_completed: false
        }]);

        if (settingsError) throw new Error(`Settings Creation Failed: ${settingsError.message}`);

        // 5. Seed Default Categories (Entrate & Uscite)
        const defaultCategories = [
            // INCOME (Categories: Ricavi)
            // 1. Provvigioni
            { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni vendite immobili', sort_order: 10 },
            { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni locazioni', sort_order: 11 },
            { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni affitti turistici', sort_order: 12 },
            { section: 'income', macro_category: 'provvigioni', name: 'Provvigioni affitti di azienda', sort_order: 13 },

            // 2. Collaborazioni
            { section: 'income', macro_category: 'collaborazioni', name: 'Provvigioni da collaborazione inter-agenzia', sort_order: 20 },
            { section: 'income', macro_category: 'collaborazioni', name: 'Segnalazioni clienti', sort_order: 21 },
            { section: 'income', macro_category: 'collaborazioni', name: 'Referral attivi', sort_order: 22 },

            // 3. Servizi
            { section: 'income', macro_category: 'servizi', name: 'Consulenze immobiliari', sort_order: 30 },
            { section: 'income', macro_category: 'servizi', name: 'Valutazioni immobili', sort_order: 31 },
            { section: 'income', macro_category: 'servizi', name: 'Property management', sort_order: 32 },
            { section: 'income', macro_category: 'servizi', name: 'Gestione affitti', sort_order: 33 },
            { section: 'income', macro_category: 'servizi', name: 'Servizi post-vendita', sort_order: 34 },

            // 4. Extra
            { section: 'income', macro_category: 'extra', name: 'Rimborsi spese ricevuti', sort_order: 40 },
            { section: 'income', macro_category: 'extra', name: 'Bonus / incentivi', sort_order: 41 },
            { section: 'income', macro_category: 'extra', name: 'Altri ricavi', sort_order: 42 },

            // EXPENSE (Spese - Detailed)
            // 1. Personale (Agenti & Collaboratori)
            { section: 'expense', macro_category: 'personale', name: 'Provvigioni agenti interni', sort_order: 100 },
            { section: 'expense', macro_category: 'personale', name: 'Provvigioni collaboratori esterni', sort_order: 101 },
            { section: 'expense', macro_category: 'personale', name: 'Provvigioni segnalatori', sort_order: 102 },
            { section: 'expense', macro_category: 'personale', name: 'Premi e incentivi agenti', sort_order: 103 },
            { section: 'expense', macro_category: 'personale', name: 'Rimborsi spese agenti', sort_order: 104 },

            // 2. Ufficio
            { section: 'expense', macro_category: 'ufficio', name: 'Affitto ufficio', sort_order: 200 },
            { section: 'expense', macro_category: 'ufficio', name: 'Spese condominiali', sort_order: 201 },
            { section: 'expense', macro_category: 'ufficio', name: 'Utenze (luce, gas, acqua)', sort_order: 202 },
            { section: 'expense', macro_category: 'ufficio', name: 'Internet e telefono', sort_order: 203 },
            { section: 'expense', macro_category: 'ufficio', name: 'Pulizie', sort_order: 204 },
            { section: 'expense', macro_category: 'ufficio', name: 'Cancelleria', sort_order: 205 },
            { section: 'expense', macro_category: 'ufficio', name: 'Arredi e manutenzione ufficio', sort_order: 206 },

            // 3. Marketing
            { section: 'expense', macro_category: 'marketing', name: 'Portali immobiliari (Immobiliare.it, Idealista)', sort_order: 300 },
            { section: 'expense', macro_category: 'marketing', name: 'Pubblicità online (Meta, Google Ads)', sort_order: 301 },
            { section: 'expense', macro_category: 'marketing', name: 'Cartellonistica / cartelli vendesi', sort_order: 302 },
            { section: 'expense', macro_category: 'marketing', name: 'Servizi fotografici / video', sort_order: 303 },
            { section: 'expense', macro_category: 'marketing', name: 'Home staging', sort_order: 304 },
            { section: 'expense', macro_category: 'marketing', name: 'Siti web / hosting', sort_order: 305 },
            { section: 'expense', macro_category: 'marketing', name: 'Grafica e branding', sort_order: 306 },
            { section: 'expense', macro_category: 'marketing', name: 'Volantinaggio', sort_order: 307 },

            // 4. Trasporti
            { section: 'expense', macro_category: 'trasporti', name: 'Carburante', sort_order: 400 },
            { section: 'expense', macro_category: 'trasporti', name: 'Autostrade / parcheggi', sort_order: 401 },
            { section: 'expense', macro_category: 'trasporti', name: 'Manutenzione auto', sort_order: 402 },
            { section: 'expense', macro_category: 'trasporti', name: 'Noleggio auto', sort_order: 403 },
            { section: 'expense', macro_category: 'trasporti', name: 'Trasferte e viaggi di lavoro', sort_order: 404 },

            // 5. Tecnologia (Software)
            { section: 'expense', macro_category: 'tecnologia', name: 'CRM immobiliare', sort_order: 500 },
            { section: 'expense', macro_category: 'tecnologia', name: 'Software gestionale', sort_order: 501 },
            { section: 'expense', macro_category: 'tecnologia', name: 'Abbonamenti AI', sort_order: 502 },
            { section: 'expense', macro_category: 'tecnologia', name: 'Cloud / storage', sort_order: 503 },
            { section: 'expense', macro_category: 'tecnologia', name: 'Firma digitale', sort_order: 504 },
            { section: 'expense', macro_category: 'tecnologia', name: 'PEC / SPID', sort_order: 505 },

            // 6. Consulenze
            { section: 'expense', macro_category: 'consulenze', name: 'Commercialista', sort_order: 600 },
            { section: 'expense', macro_category: 'consulenze', name: 'Notaio', sort_order: 601 },
            { section: 'expense', macro_category: 'consulenze', name: 'Avvocato', sort_order: 602 },
            { section: 'expense', macro_category: 'consulenze', name: 'Consulente del lavoro', sort_order: 603 },
            { section: 'expense', macro_category: 'consulenze', name: 'Geometra / tecnico', sort_order: 604 },
            { section: 'expense', macro_category: 'consulenze', name: 'Certificazioni energetiche (APE)', sort_order: 605 },

            // 7. Amministrativi
            { section: 'expense', macro_category: 'amministrativi', name: 'Spese bancarie', sort_order: 700 },
            { section: 'expense', macro_category: 'amministrativi', name: 'Commissioni POS', sort_order: 701 },
            { section: 'expense', macro_category: 'amministrativi', name: 'Commissioni PayPal / Stripe', sort_order: 702 },
            { section: 'expense', macro_category: 'amministrativi', name: 'Bolli', sort_order: 703 },
            { section: 'expense', macro_category: 'amministrativi', name: 'Diritti camerali', sort_order: 704 },
            { section: 'expense', macro_category: 'amministrativi', name: 'Visure catastali', sort_order: 705 },

            // 8. Fisco (Imposte)
            { section: 'expense', macro_category: 'fisco', name: 'IVA versata', sort_order: 800 },
            { section: 'expense', macro_category: 'fisco', name: 'Ritenute d’acconto', sort_order: 801 },
            { section: 'expense', macro_category: 'fisco', name: 'IMU (se pertinente)', sort_order: 802 },
            { section: 'expense', macro_category: 'fisco', name: 'Tasse e imposte varie', sort_order: 803 },
            { section: 'expense', macro_category: 'fisco', name: 'Sanzioni / interessi', sort_order: 804 },

            // 9. Formazione
            { section: 'expense', macro_category: 'formazione', name: 'Corsi di formazione', sort_order: 900 },
            { section: 'expense', macro_category: 'formazione', name: 'Eventi di settore', sort_order: 901 },
            { section: 'expense', macro_category: 'formazione', name: 'Masterclass', sort_order: 902 },
            { section: 'expense', macro_category: 'formazione', name: 'Coaching', sort_order: 903 },
            { section: 'expense', macro_category: 'formazione', name: 'Libri e materiali didattici', sort_order: 904 },

            // 10. Varie
            { section: 'expense', macro_category: 'varie', name: 'Spese varie', sort_order: 1000 },
            { section: 'expense', macro_category: 'varie', name: 'Spese non categorizzate', sort_order: 1001 },
            { section: 'expense', macro_category: 'varie', name: 'Costi straordinari', sort_order: 1002 }
        ];

        const { error: seedError } = await supabaseAdmin
            .from('transaction_categories')
            .insert(defaultCategories.map(c => ({ ...c, organization_id: orgData.id })));

        if (seedError) {
            console.error("Category Seeding Warning:", seedError);
            // We don't rollback for this, it's non-critical, user can add manually.
        }

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error("Registration API Error:", error);

        // ROLLBACK
        if (createdUserId) {
            console.warn(`[ROLLBACK] Deleting user ${createdUserId} due to failure...`);
            await supabaseAdmin.auth.admin.deleteUser(createdUserId);
            // If we created an org, we might want to delete it too, but user deletion cascades usually? 
            // Or orphaned orgs are less critical than zombie users.
            if (createdOrgId) {
                await supabaseAdmin.from('organizations').delete().eq('id', createdOrgId);
            }
        }

        return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
    }
}
