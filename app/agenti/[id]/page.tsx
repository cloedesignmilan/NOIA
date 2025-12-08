"use client";

import { useState, useEffect, useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { ArrowUpRight, CheckCircle2, Clock, Filter, LayoutDashboard, MapPin, Phone, TrendingUp, User, PieChart, Target, CalendarDays, Wallet, BadgeEuro, ArrowRight, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { TrendChart } from '@/components/charts/TrendChart';
import { AssignmentForm } from '@/components/agenti/AssignmentForm';

type DateRange = 'month' | 'quarter' | 'year' | 'all';

export default function AgentDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const { orgId } = useCurrentOrg();
    const [agent, setAgent] = useState<any>(null);
    const [dateRange, setDateRange] = useState<DateRange>('year');

    // Raw Data
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [allAssignments, setAllAssignments] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [pipelineTab, setPipelineTab] = useState<'active' | 'to_collect' | 'collected' | 'all_assignments'>('active');

    const fetchData = async () => {
        if (!orgId || !id) return;
        setLoading(true);

        // 1. Fetch Agent Profile
        const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('id', id)
            .single();

        if (agentError || !agentData) {
            console.error("Agent not found", agentError);
            setLoading(false);
            return;
        }
        setAgent(agentData);

        // 2. Fetch Transactions (Income)
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', orgId) // Ensure org check
            .eq('agent_id', id)
            .eq('type', 'income') // Only income relevant for commissions
            .order('date', { ascending: false });

        if (transactions) setAllTransactions(transactions);

        // 3. Fetch Assignments
        const { data: assignmentData } = await supabase
            .from('assignments')
            .select('*')
            .eq('agent_id', id)
            .order('created_at', { ascending: false });

        if (assignmentData) setAllAssignments(assignmentData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [orgId, id]);

    // --- Computed Metrics based on Date Range ---
    const metrics = useMemo(() => {
        const now = new Date();
        const startOfRange = new Date();

        if (dateRange === 'month') startOfRange.setMonth(now.getMonth(), 1);
        if (dateRange === 'quarter') startOfRange.setMonth(now.getMonth() - 2, 1); // Approx
        if (dateRange === 'year') startOfRange.setFullYear(now.getFullYear(), 0, 1);
        if (dateRange === 'all') startOfRange.setFullYear(2000, 0, 1);
        startOfRange.setHours(0, 0, 0, 0);

        // Filter Transactions
        const filteredTransactions = allTransactions.filter(t => new Date(t.date) >= startOfRange);

        // Filter Assignments (by acquisition date)
        const filteredAssignments = allAssignments.filter(a => new Date(a.acquisition_date) >= startOfRange);

        // KPI Calculations
        const totalRevenue = filteredTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
        const totalCommissions = filteredTransactions.reduce((acc, t) => acc + (t.agent_commission_accrued || 0), 0);
        const paidCommissions = filteredTransactions
            .filter(t => t.agent_commission_status === 'paid')
            .reduce((acc, t) => acc + (t.agent_commission_accrued || 0), 0);
        const pendingCommissions = totalCommissions - paidCommissions;

        // Advanced KPIs
        const assignmentCount = filteredAssignments.length;
        const closedWonCount = filteredAssignments.filter(a => a.status === 'closed_won').length;
        const conversionRate = assignmentCount > 0 ? (closedWonCount / assignmentCount) * 100 : 0;

        const avgDealValue = closedWonCount > 0
            ? filteredAssignments.filter(a => a.status === 'closed_won').reduce((acc, a) => acc + (a.realized_value || 0), 0) / closedWonCount
            : 0;

        // Forecast: Active Assignments * Probability (50% hardcoded for now) * Agent Commission %
        // We need accurate estimation. Let's assume estimated_value * agreed_% * 0.5 probability
        const activeAssignments = allAssignments.filter(a => a.status === 'active'); // Pipeline is usually ALL active, not just time-filtered
        const forecastCommission = activeAssignments.reduce((acc, a) => {
            const val = a.estimated_value || 0;
            const commPct = (a.agreed_commission_percentage || agent?.base_commission_percentage || 0) / 100;
            // Agent share of that commission? Usually agent gets % of the agency commission.
            // Let's assume 'agreed_commission_percentage' IS the agency fee.
            // And agent gets 'base_commission_percentage' OF that fee.
            // Formula: Deal Value * Agency% * Agent% * Probability(0.5)
            const agencyFee = val * commPct;
            const agentShare = agencyFee * ((agent?.base_commission_percentage || 0) / 100);
            return acc + (agentShare * 0.5);
        }, 0);

        return {
            totalRevenue,
            totalCommissions,
            paidCommissions,
            pendingCommissions,
            assignmentCount,
            conversionRate,
            avgDealValue,
            forecastCommission,
            filteredTransactions // For chart
        };
    }, [allTransactions, allAssignments, dateRange, agent]);


    // --- Chart Data Preparation ---
    const chartData = useMemo(() => {
        if (!metrics.filteredTransactions.length) return [];

        const map = new Map<string, number>();
        // Group by Month usually better for trends
        metrics.filteredTransactions.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`; // "2024-12"
            map.set(key, (map.get(key) || 0) + (t.agent_commission_accrued || 0));
        });

        // Fill gaps if year view? Simplified for now: just sorted entries
        return Array.from(map.entries())
            .map(([key, value]) => {
                const [y, m] = key.split('-');
                return {
                    name: new Date(parseInt(y), parseInt(m) - 1).toLocaleString('it-IT', { month: 'short', year: '2-digit' }),
                    value: value,
                    date: new Date(parseInt(y), parseInt(m) - 1) // for sorting
                };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [metrics.filteredTransactions]);


    // --- Pipeline Lists ---
    const pipelineList = useMemo(() => {
        if (pipelineTab === 'active') {
            return allAssignments.filter(a => a.status === 'active');
        } else if (pipelineTab === 'to_collect') {
            return allTransactions.filter(t => t.status === 'pending');
        } else if (pipelineTab === 'collected') {
            return allTransactions.filter(t => t.status === 'paid');
        } else {
            // 'all_assignments'
            return allAssignments;
        }
    }, [pipelineTab, allAssignments, allTransactions]);


    // --- Actions ---
    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo incarico?")) return;

        try {
            const { error } = await supabase
                .from('assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;

            // Update local state
            setAllAssignments(prev => prev.filter(a => a.id !== assignmentId));
            // Trigger refetch to update KPIs
            fetchData();
        } catch (err) {
            console.error("Error deleting assignment:", err);
            alert("Errore durante l'eliminazione dell'incarico.");
        }
    };


    if (!loading && !agent) {
        return <div className="p-12 text-center">Agente non trovato</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Profile */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 glass-card p-6 bg-gradient-to-r from-background to-muted/20">
                <div className="flex items-center gap-5">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-background">
                        {agent ? `${agent.first_name[0]}${agent.last_name[0]}` : '...'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {agent ? `${agent.first_name} ${agent.last_name}` : 'Caricamento...'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase text-[10px] tracking-widest border border-primary/20">
                                {agent?.role || 'Agente'}
                            </span>
                            <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                                <Phone className="w-3.5 h-3.5" /> {agent?.phone || '-'}
                            </span>
                            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Base: {agent?.base_commission_percentage}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Global Date Filter */}
                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border border-border/50">
                    {(['month', 'quarter', 'year', 'all'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setDateRange(r)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize",
                                dateRange === r
                                    ? "bg-background text-primary shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            {r === 'month' && 'Mese'}
                            {r === 'quarter' && 'Trimestre'}
                            {r === 'year' && 'Anno'}
                            {r === 'all' && 'Tutto'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid - Primary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="widget-premium bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Fatturato Generato</p>
                        <Wallet className="w-4 h-4 text-blue-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">€ {metrics.totalRevenue.toLocaleString('it-IT')}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Totale Vendite/Affitti</p>
                </div>

                <div className="widget-premium bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Provvigioni Maturate</p>
                        <BadgeEuro className="w-4 h-4 text-emerald-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        € {metrics.totalCommissions.toLocaleString('it-IT')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Spettanti all'agente</p>
                </div>

                <div className="widget-premium bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider">Da Liquidare</p>
                        <Clock className="w-4 h-4 text-purple-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-purple-700 dark:text-purple-400">
                        € {metrics.pendingCommissions.toLocaleString('it-IT')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Già incassate, da pagare</p>
                </div>

                <div className="widget-premium bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50 dark:border-orange-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400 tracking-wider">Forecast (Stima)</p>
                        <Target className="w-4 h-4 text-orange-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-orange-700 dark:text-orange-400">
                        € {metrics.forecastCommission.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Proiezione Pipeline Attiva (50%)</p>
                </div>
            </div>

            {/* Advanced KPIs - Secondary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Tasso Conversione</p>
                        <p className="text-xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Valore Medio Deal</p>
                        <p className="text-xl font-bold">€ {metrics.avgDealValue.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-pink-500/10 text-pink-500">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Nuovi Incarichi</p>
                        <p className="text-xl font-bold">{metrics.assignmentCount}</p>
                    </div>
                </div>
            </div>

            {/* Chart Section & Detailed Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Chart */}
                <div className="lg:col-span-2 glass-card p-6 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Trend Provvigioni
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        {chartData.length > 0 ? (
                            <TrendChart data={chartData} dataKey="value" category="" colors={{ stroke: '#10b981', fill: '#d1fae5' }} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                <TrendingUp className="w-12 h-12 mb-2" />
                                <p>Nessun dato nel periodo selezionato</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Pipeline List */}
                <div className="glass-card p-0 overflow-hidden flex flex-col h-full max-h-[600px]">
                    <div className="p-4 border-b border-border/50 bg-muted/20">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-foreground">Pipeline</h3>
                            {/* Hidden Force Delete if needed? No, user can delete from list. */}
                        </div>
                        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
                            <button
                                onClick={() => setPipelineTab('active')}
                                className={cn("px-2 py-1.5 text-xs font-bold rounded-md transition-all flex-1 text-center", pipelineTab === 'active' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Attivi ({allAssignments.filter(a => a.status === 'active').length})
                            </button>
                            <button
                                onClick={() => setPipelineTab('to_collect')}
                                className={cn("px-2 py-1.5 text-xs font-bold rounded-md transition-all flex-1 text-center", pipelineTab === 'to_collect' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Da Incassare
                            </button>
                            <button
                                onClick={() => setPipelineTab('collected')}
                                className={cn("px-2 py-1.5 text-xs font-bold rounded-md transition-all flex-1 text-center", pipelineTab === 'collected' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Chiusi
                            </button>
                            <button
                                onClick={() => setPipelineTab('all_assignments' as any)}
                                className={cn("px-2 py-1.5 text-xs font-bold rounded-md transition-all flex-1 text-center", pipelineTab === 'all_assignments' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Tutti ({allAssignments.length})
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-4 space-y-3">
                        {pipelineList.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-sm">Nessun elemento in questa lista.</p>
                                {pipelineTab === 'active' && (
                                    <button
                                        onClick={() => setIsAssignmentFormOpen(true)}
                                        className="mt-4 text-primary font-bold text-xs hover:underline"
                                    >
                                        + Crea Incarico
                                    </button>
                                )}
                            </div>
                        ) : (
                            pipelineList.map((item: any) => (
                                <div key={item.id} className="relative group p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all hover:shadow-md">
                                    {(pipelineTab === 'active' || pipelineTab === 'all_assignments') && (
                                        <div className="absolute -top-2 -right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedAssignment(item); setIsAssignmentFormOpen(true); }}
                                                className="p-1.5 bg-blue-100 text-blue-600 rounded-full shadow-sm hover:bg-blue-200 transition-all"
                                                title="Modifica Incarico"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(item.id); }}
                                                className="p-1.5 bg-red-100 text-red-600 rounded-full shadow-sm hover:bg-red-200 transition-all"
                                                title="Elimina Incarico"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            {/* Logic to distinguish Assignment vs Transaction display */}
                                            <h4 className="font-bold text-sm line-clamp-1">{item.title || item.description}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(item.date || item.acquisition_date).toLocaleDateString('it-IT')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">
                                                € {(item.amount || item.estimated_value || 0).toLocaleString('it-IT')}
                                            </p>
                                            {/* Status Badge */}
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm",
                                                (item.status === 'active' || item.status === 'pending') ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                                    (item.status === 'closed_won' || item.status === 'paid') ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                                        "bg-gray-100 text-gray-600"
                                            )}>
                                                {item.status === 'closed_won' ? 'Venduto' : item.status === 'active' ? 'Attivo' : item.status === 'paid' ? 'Incassato' : item.status === 'pending' ? 'In Attesa' : item.status}
                                            </span>
                                        </div>
                                    </div>
                                    {pipelineTab === 'active' && (
                                        <div className="mt-2 text-xs flex justify-between items-center text-muted-foreground bg-muted/30 p-1.5 rounded-lg">
                                            <span>Provvigione Stimata:</span>
                                            <span className="font-semibold text-foreground">
                                                {/* Estimation logic same as forecast */}
                                                € {((item.estimated_value * ((item.agreed_commission_percentage || 3) / 100)) * ((agent?.base_commission_percentage || 10) / 100)).toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        {pipelineTab === 'active' && (
                            <button
                                onClick={() => { setSelectedAssignment(null); setIsAssignmentFormOpen(true); }}
                                className="w-full py-3 mt-2 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-bold"
                            >
                                <ArrowRight className="w-4 h-4" /> Aggiungi Incarico
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AssignmentForm
                isOpen={isAssignmentFormOpen}
                onClose={() => setIsAssignmentFormOpen(false)}
                onSuccess={() => { fetchData(); setIsAssignmentFormOpen(false); }}
                agentId={id}
                initialData={selectedAssignment}
            />
        </div>
    );
}
