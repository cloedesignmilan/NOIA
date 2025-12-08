import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useCurrentOrg() {
    const [orgId, setOrgId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrg() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }
                setUserId(user.id);

                // Fetch profile to get org_id
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setOrgId(profile.organization_id);
                }
            } catch (e) {
                console.error("Error fetching org:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchOrg();
    }, []);

    return { orgId, userId, loading };
}
