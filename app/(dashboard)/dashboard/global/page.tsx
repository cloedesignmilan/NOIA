"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, TrendingUp, TrendingDown, Wallet, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils'; // Assuming this exists or I'll implement inline

function formatEur(val: number) {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
}

interface AgencyStats {
    id: string;
    name: string;
    income: number;
    expense: number;
    profit: number;
    role: string;
}

export default function GlobalDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AgencyStats[]>([]);
    const [totals, setTotals] = useState({ income: 0, expense: 0, profit: 0 });
    const router = useRouter();

    useEffect(() => {
        async function loadGlobalStats() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get All My Agencies
            const { data: memberships } = await supabase
                .from('organization_members')
                .select('organization_id, role')
                .eq('user_id', user.id);

            if (!memberships || memberships.length === 0) {
                setLoading(false);
                return;
            }

            const orgIds = memberships.map(m => m.organization_id);

            // 2. Fetch Organizations Details
            const { data: orgs } = await supabase
                .from('organizations')
                .select('id, name')
                .in('id', orgIds);

            if (!orgs) {
                setLoading(false);
                return;
            }

            // 3. Fetch Transactions for ALL these orgs (Aggregated by Org)
            // Ideally we'd have an API or RPC for this to avoid fetching millions of rows.
            // For now, client-side aggregation of "Status=Paid" transactions for simple MVP?
            // "Solo nella versione elite... situatione generale".
            // Let's keep it simple: Fetch *sums* via RPC if possible, or just fetch all 'paid' transactions for these orgs (might be heavy).
            // Better: Create an API endpoint /api/dashboard/global?
            // But let's stick to client for speed of dev if data volume is low.
            // PROD: Should use RPC `get_org_stats(org_id)`.
            // Let's try to query transaction_sums or similar.

            // Query: Select amount, type, organization_id from transactions where organization_id in [ids] and status = 'paid'
            // We can group by client side.

            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount, type, organization_id')
                .in('organization_id', orgIds)
                .eq('status', 'paid'); // Only settled finances

            const agencies: AgencyStats[] = orgs.map(org => {
                const orgTrans = transactions?.filter(t => t.organization_id === org.id) || [];

                const income = orgTrans.filter(t => t.type === 'income').reduce((ss, t) => ss + (t.amount || 0), 0);
                const expense = orgTrans.filter(t => t.type === 'expense').reduce((ss, t) => ss + (t.amount || 0), 0); // Expenses are usually stored negative? In previous steps I saw they are negative.
                const net = income + expense; // algebraic sum

                return {
                    id: org.id,
                    name: org.name,
                    role: memberships.find(m => m.organization_id === org.id)?.role || 'member',
                    income,
                    expense,
                    profit: net
                };
            });

            setStats(agencies);

            setTotals({
                income: agencies.reduce((s, a) => s + a.income, 0),
                expense: agencies.reduce((s, a) => s + a.expense, 0),
                profit: agencies.reduce((s, a) => s + a.profit, 0)
            });

            setLoading(false);
        }

        loadGlobalStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Global Dashboard</h1>
                <p className="text-muted-foreground mt-1">Panoramica consolidata di tutte le tue agenzie.</p>
            </div>

            {/* Totals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-card border border-border ps-card shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ricavi Totali</p>
                            <h3 className="text-2xl font-bold text-foreground mt-1">{formatEur(totals.income)}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-border ps-card shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Spese Totali</p>
                            <h3 className="text-2xl font-bold text-foreground mt-1">{formatEur(Math.abs(totals.expense))}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-card border border-border ps-card shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Utile Netto</p>
                            <h3 className="text-2xl font-bold text-foreground mt-1">{formatEur(totals.profit)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border/50">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        Dettaglio per Agenzia
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-xs uppercase font-bold text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4">Agenzia</th>
                                <th className="px-6 py-4 text-right text-emerald-600">Entrate</th>
                                <th className="px-6 py-4 text-right text-rose-600">Uscite</th>
                                <th className="px-6 py-4 text-right">Utile</th>
                                <th className="px-6 py-4 w-[100px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {stats.map(agency => (
                                <tr key={agency.id} className="hover:bg-muted/20 transition-colors group">
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-base text-foreground">{agency.name}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{agency.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                        +{formatEur(agency.income)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-rose-600">
                                        {formatEur(agency.expense)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold">
                                        <span className={agency.profit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                            {formatEur(agency.profit)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={async () => {
                                                // Quick Switch
                                                const { data: { session } } = await supabase.auth.getSession();
                                                await fetch('/api/organizations/switch', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                                                    body: JSON.stringify({ organizationId: agency.id })
                                                });
                                                window.location.href = '/dashboard';
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-full text-primary"
                                            title="Vai alla Dashboard"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
