"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Clock, Building2, TrendingUp, AlertTriangle, Loader2, Trash2, LogOut } from "lucide-react";

export default function AdminDashboardClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa agenzia? Questa azione è irreversibile e cancellerà tutti i dati, utenti e transazioni associati.")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`/api/admin/agency/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Errore durante l'eliminazione");
            }

            // Remove from local state
            setData((prev: any) => prev.filter((o: any) => o.id !== id));

        } catch (err: any) {
            alert("Errore: " + err.message);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            // 1. Check strict email match first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.email !== 'superadmin@noia.cloud') {
                router.push('/dashboard');
                return;
            }

            // 2. Fetch data from secure API
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const res = await fetch('/api/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to load");
                }

                const json = await res.json();
                setData(json.orgs);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error) return <div className="p-8 text-destructive font-bold">Error: {error}</div>;

    const orgs = data || [];

    // Calculate Stats
    const totalAgencies = orgs.length;
    const activeSubs = orgs.filter((o: any) => o.subscription_status === 'active').length;
    const trials = orgs.filter((o: any) => o.subscription_status === 'trial').length;
    const expired = orgs.filter((o: any) => ['expired', 'canceled'].includes(o.subscription_status)).length;

    // New registrations last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newRegs = orgs.filter((o: any) => new Date(o.created_at) > sevenDaysAgo).length;

    return (
        <div className="min-h-screen bg-background text-foreground p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-primary" /> Admin HQ
                    </h1>
                    <p className="text-muted-foreground">Benvenuto, SuperAdmin.</p>
                </div>
                <div className="text-right flex items-center justify-end gap-4">
                    <div className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live System Status
                    </div>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                        className="text-xs font-medium text-muted-foreground hover:text-destructive flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Totale Agenzie</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAgencies}</div>
                        <p className="text-xs text-muted-foreground">+{newRegs} ultimi 7 giorni</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Abbonamenti Attivi</CardTitle>
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{activeSubs}</div>
                        <p className="text-xs text-muted-foreground">MRR Revenue Bearing</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Prova (Trial)</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{trials}</div>
                        <p className="text-xs text-muted-foreground">Potenziali conversioni</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Scaduti / Cancellati</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{expired}</div>
                        <p className="text-xs text-muted-foreground">Churn</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="bg-card border-border/50">
                <CardHeader>
                    <CardTitle>Lista Agenzie ({totalAgencies})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-4 py-3">Agenzia</th>
                                    <th className="px-4 py-3">Contatti</th>
                                    <th className="px-4 py-3">Iscrizione</th>
                                    <th className="px-4 py-3">Piano / Spesa</th>
                                    <th className="px-4 py-3">Stato</th>
                                    <th className="px-4 py-3">Attività</th>
                                    <th className="px-4 py-3 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {orgs.map((org: any) => {
                                    // Calculate Age
                                    const created = new Date(org.created_at);
                                    const now = new Date();
                                    const diffTime = Math.abs(now.getTime() - created.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    return (
                                        <tr key={org.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                                                        {(org.agency_name_display || org.name).substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div>{org.agency_name_display || org.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{org.id.split('-')[0]}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="text-foreground">{org.address || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">{org.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium">{created.toLocaleDateString()}</div>
                                                <div className="text-xs text-muted-foreground">{diffDays} giorni fa</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-bold capitalize">{org.subscription_tier || 'free'}</div>
                                                    {org.spend_amount > 0 && <span className="text-xs bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">€{org.spend_amount}/mo</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${org.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    org.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {org.subscription_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{org.transaction_count || 0} op.</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {org.last_active ? new Date(org.last_active).toLocaleDateString() : '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(org.id)}
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                                                    title="Elimina Agenzia"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
