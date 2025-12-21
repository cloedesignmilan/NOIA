import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Clock, Building2, TrendingUp, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. SECURITY CHECK POOR MAN'S RBAC
    if (!user || user.email !== 'superadmin@noia.cloud') {
        redirect('/dashboard');
    }

    // 2. Fetch Data (Bypassing RLS)
    const { data: orgs, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="p-10 text-destructive">Error loading admin data: {error.message}</div>;
    }

    // 3. Calculate Stats
    const totalAgencies = orgs?.length || 0;
    const activeSubs = orgs?.filter(o => o.subscription_status === 'active').length || 0;
    const trials = orgs?.filter(o => o.subscription_status === 'trial').length || 0;
    const expired = orgs?.filter(o => ['expired', 'canceled'].includes(o.subscription_status)).length || 0;

    // New registrations last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newRegs = orgs?.filter(o => new Date(o.created_at) > sevenDaysAgo).length || 0;

    return (
        <div className="min-h-screen bg-background text-foreground p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-primary" /> Admin HQ
                    </h1>
                    <p className="text-muted-foreground">Benvenuto, SuperAdmin.</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold text-emerald-500 flex items-center justify-end gap-2">
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
                                    <th className="px-4 py-3">Fine Prova</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {orgs?.map((org) => (
                                    <tr key={org.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3 font-medium">{org.name || 'N/A'}</td>
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
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {org.trial_ends_at ? new Date(org.trial_ends_at).toLocaleDateString() : '-'}
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
