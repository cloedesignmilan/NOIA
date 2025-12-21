"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Clock, Building2, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

export default function AdminDashboardClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

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
                <div className="text-right">
                    <div className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live System Status
                    </div>
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
                                    <th className="px-4 py-3">Data Iscrizione</th>
                                    <th className="px-4 py-3">Piano</th>
                                    <th className="px-4 py-3">Stato</th>
                                    <th className="px-4 py-3">Attività</th>
                                    <th className="px-4 py-3">Ultimo Inserimento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {orgs.map((org: any) => (
                                    <tr key={org.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {org.name || 'N/A'}
                                            <div className="text-xs text-muted-foreground">{org.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(org.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 capitalize">{org.plan_tier}</td>
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
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {org.last_active ? (
                                                <span className={new Date().getTime() - new Date(org.last_active).getTime() < 86400000 ? "text-emerald-500 font-bold" : ""}>
                                                    {new Date(org.last_active).toLocaleString()}
                                                </span>
                                            ) : 'Mai'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
