"use client";

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, Plus, CreditCard, Activity, Calendar, ArrowRight, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { TrendChart } from '@/components/charts/TrendChart';

export default function DashboardHome() {
    const { orgId } = useCurrentOrg();
    const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0, margin: 0, vatBalance: 0, totalWithholding: 0, vatStatus: 'debito' });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                setUser({ ...user, full_name: profile?.full_name });
            }
        };
        getUserData();
    }, []);

    useEffect(() => {
        if (!orgId) return;

        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch All Transactions (for totals & chart - optimization: limit to this year/last 12 months in real app)
            const { data: allTrans } = await supabase
                .from('transactions')
                .select('amount, type, date, category, description, id, vat_amount, withholding_tax')
                .eq('organization_id', orgId)
                .order('date', { ascending: false });

            if (allTrans) {
                // Income (Taxable)
                const grossIncome = allTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + (curr.amount || 0), 0);
                // Withholding
                const totalWithholding = allTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + (curr.withholding_tax || 0), 0);
                // Net Income (Taxable - Withholding)
                const netIncome = grossIncome - totalWithholding;

                const expenses = allTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(curr.amount || 0), 0);

                // VAT
                const vatCollected = allTrans.filter(t => t.type === 'income').reduce((acc, curr) => acc + (curr.vat_amount || 0), 0);
                const vatPaid = allTrans.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(curr.vat_amount || 0), 0);
                const vatBalance = vatCollected - vatPaid; // + means Debt (we have collected more than paid), - means Credit

                // Profit (Net Income - Expenses)
                const balance = netIncome - expenses;
                const margin = netIncome > 0 ? ((netIncome - expenses) / netIncome) * 100 : 0;

                setStats({
                    income: netIncome, // Show Net
                    expenses,
                    balance,
                    margin,
                    vatBalance,
                    totalWithholding,
                    vatStatus: vatBalance >= 0 ? 'debito' : 'credito'
                });

                // --- Chart Data (Last 6 Months) ---
                const today = new Date();
                const map = new Map<string, { income: number, expense: number }>();

                // Initialize last 6 months
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    map.set(key, { income: 0, expense: 0 });
                }

                allTrans.forEach(t => {
                    const d = new Date(t.date);
                    // Filter for last ~6-7 months only for chart
                    const diffMonths = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
                    if (diffMonths <= 5 && diffMonths >= 0) {
                        const key = `${d.getFullYear()}-${d.getMonth()}`;
                        if (map.has(key)) {
                            const current = map.get(key)!;
                            if (t.type === 'income') current.income += t.amount || 0;
                            else current.expense += Math.abs(t.amount || 0);
                        }
                    }
                });

                const cData = Array.from(map.entries()).map(([key, val]) => {
                    const [y, m] = key.split('-');
                    const dateObj = new Date(parseInt(y), parseInt(m), 1);
                    return {
                        name: dateObj.toLocaleString('it-IT', { month: 'short' }).toUpperCase(),
                        income: val.income,
                        expense: val.expense,
                        date: dateObj // for sorting
                    };
                }).sort((a, b) => a.date.getTime() - b.date.getTime());

                setChartData(cData);

                // --- Recent Activity ---
                setRecentTransactions(allTrans.slice(0, 5));
            }
            setLoading(false);
        };

        fetchData();
    }, [orgId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                            Dashboard
                        </span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Bentornato, {user?.full_name || user?.email?.split('@')[0]}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Net Profit - Hero Card (Span Full on Mobile, 2 cols on tablet, 4 on desktop? No, let's keep separate cards as requested) -> Actually let's make Profit Span 4? User asked for Entrate, Uscite, IVA, Ritenute.
                 Let's keep Profit as a Hero Row? Or just 4 cards?
                 I will keep Profit as full width top, then 4 cards below. This is cleaner. */}

                {/* Net Profit - Hero Card */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 widget-premium bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-200/50 dark:border-indigo-800/50 relative overflow-hidden flex flex-col justify-between min-h-[160px] p-6 mb-2">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2 opacity-90">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Profitto Netto (Netto - Spese)</span>
                            <Wallet className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h2 className={cn("text-4xl font-black tracking-tighter", stats.balance >= 0 ? "text-indigo-700 dark:text-indigo-300" : "text-rose-600")}>
                            {loading ? "..." : formatCurrency(stats.balance)}
                        </h2>

                        <div className="mt-4 flex items-center gap-2">
                            <span className={cn(
                                "inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-md border",
                                stats.margin >= 20 ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" :
                                    stats.margin > 0 ? "bg-indigo-500/10 text-indigo-700 border-indigo-200" :
                                        "bg-rose-500/10 text-rose-700 border-rose-200"
                            )}>
                                <Activity className="w-3 h-3" />
                                {stats.margin.toFixed(1)}% Margine
                            </span>
                        </div>
                    </div>
                    {/* Abstract Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                </div>


                {/* Income Card (Net) */}
                <Link href="/entrate" className="group glass-card p-6 flex flex-col justify-between hover:border-emerald-500/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all duration-300">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Entrate (Nette)</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{loading ? '...' : formatCurrency(stats.income)}</h3>
                    </div>
                </Link>

                {/* Expense Card */}
                <Link href="/spese" className="group glass-card p-6 flex flex-col justify-between hover:border-rose-500/30 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all duration-300">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-2xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Uscite</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{loading ? '...' : formatCurrency(stats.expenses)}</h3>
                    </div>
                </Link>

                {/* Ritenute Card */}
                <div className="glass-card p-6 flex flex-col justify-between border-orange-200/50 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-2xl text-orange-600 dark:text-orange-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Totale Ritenute</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{loading ? '...' : formatCurrency(stats.totalWithholding || 0)}</h3>
                    </div>
                </div>

                {/* VAT Situation */}
                <div className={cn("glass-card p-6 flex flex-col justify-between transition-all", stats.vatStatus === 'debito' ? "border-blue-200/50 hover:bg-blue-50/30" : "border-emerald-200/50 hover:bg-emerald-50/30")}>
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("p-3 rounded-2xl", stats.vatStatus === 'debito' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400")}>
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className={cn("text-xs font-bold uppercase px-2 py-1 rounded-full", stats.vatStatus === 'debito' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")}>
                                {stats.vatStatus === 'debito' ? 'A Debito' : 'A Credito'}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Situazione IVA</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{loading ? '...' : formatCurrency(Math.abs(stats.vatBalance || 0))}</h3>
                    </div>
                </div>

            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/entrate" className="h-14 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base">
                    <Plus className="w-5 h-5" /> Nuova Entrata
                </Link>
                <Link href="/spese" className="h-14 rounded-xl bg-rose-600 text-white font-semibold shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base">
                    <Plus className="w-5 h-5" /> Nuova Spesa
                </Link>
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 glass-card p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Flusso di Cassa (6 Mesi)
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></div> Entrate
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></div> Uscite
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-[320px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                                <Activity className="w-5 h-5 animate-pulse" /> Caricamento...
                            </div>
                        ) : (
                            <TrendChart data={chartData} dataKey="income" category="expense" />
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card p-0 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border/50 bg-muted/20">
                        <h3 className="text-lg font-bold text-foreground">Attività Recenti</h3>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">Caricamento...</div>
                        ) : recentTransactions.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">Nessuna attività recente.</div>
                        ) : (
                            <div className="space-y-1">
                                {recentTransactions.map((t) => (
                                    <div key={t.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border",
                                                t.type === 'income'
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600"
                                                    : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-600"
                                            )}>
                                                {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground line-clamp-1">{t.description || 'Nessuna descrizione'}</p>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {new Date(t.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} • <span className="opacity-80">{t.category?.split(' - ').pop()}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "text-sm font-bold whitespace-nowrap",
                                            t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {t.type === 'income' ? '+' : '-'} {Math.abs(t.amount).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-border/50">
                        <Link href="/entrate" className="block w-full py-2.5 text-center text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            Vedi Tutto lo Storico
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
