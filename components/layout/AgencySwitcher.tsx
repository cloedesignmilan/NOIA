"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, ChevronsUpDown, PlusCircle, Building2, LayoutGrid, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function AgencySwitcher() {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchOrgs() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get My Memberships (with Org details)
            // Join query not super easy with standard client if no explicit relationship mapped in types?
            // We can do: select(*, organizations(*)) if setup?
            // Fallback: fetch members then fetch orgs

            const { data: members } = await supabase
                .from('organization_members')
                .select('organization_id, role')
                .eq('user_id', user.id);

            if (members && members.length > 0) {
                const orgIds = members.map(m => m.organization_id);
                const { data: orgs } = await supabase
                    .from('organizations')
                    .select('*')
                    .in('id', orgIds);

                if (orgs) setOrganizations(orgs);
            }

            // 2. Get Active user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (profile) setActiveOrgId(profile.organization_id);
            setLoading(false);
        }

        fetchOrgs();
    }, []);

    const handleSwitch = async (orgId: string) => {
        setIsOpen(false);
        if (orgId === activeOrgId) return;

        // Optimistic UI?
        setActiveOrgId(orgId);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/organizations/switch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ organizationId: orgId })
            });

            if (!res.ok) throw new Error("Switch failed");

            // Hard Reload to reset all swr/context hooks
            window.location.reload();
        } catch (e) {
            alert("Errore cambio agenzia");
            console.error(e);
        }
    };

    const handleCreate = async () => {
        const name = prompt("Nome nuova Agenzia:");
        if (!name) return;
        setCreating(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/organizations/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ name })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'UPGRADE_REQUIRED') {
                    alert("🔒 Funzionalità ELITE\n\nDevi avere il piano Elite sull'agenzia attiva per creare nuove agenzie e gestirle in gruppo.");
                } else {
                    alert(`Errore: ${data.error}`);
                }
                return;
            }

            // Success, switch to it?
            if (confirm(`Agenzia "${name}" creata! Vuoi passare a questa agenzia ora?`)) {
                handleSwitch(data.organization.id);
            } else {
                window.location.reload(); // To refresh list
            }

        } catch (e) {
            alert("Errore creazione");
        } finally {
            setCreating(false);
        }
    };

    const activeOrg = organizations.find(o => o.id === activeOrgId);

    if (loading) return <div className="w-[200px] h-10 bg-muted/20 animate-pulse rounded-xl" />;

    return (
        <div className="relative relative-dropdown">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 transition-all w-[200px] justify-between"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold truncate">{activeOrg?.name || "Seleziona..."}</span>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[240px] bg-card border border-border/50 shadow-xl rounded-xl p-1 z-[100] animate-in slide-in-from-top-2">
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1 space-y-1">
                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Le tue agenzie
                        </div>
                        {organizations.map(org => (
                            <button
                                key={org.id}
                                onClick={() => handleSwitch(org.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors",
                                    activeOrgId === org.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="truncate text-left font-medium">{org.name}</span>
                                {activeOrgId === org.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-border/50 my-1" />

                    <div className="p-1 space-y-1">
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                            Aggiungi Agenzia
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/global')}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-bold text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Dashboard Globale
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
