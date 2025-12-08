"use client";

import { useState, useEffect, useMemo } from 'react';
import { Plus, Users, Phone, TrendingUp, Trophy, BarChart3, PieChart, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import Link from 'next/link';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { cn } from '@/lib/utils';

export default function AgentsPage() {
    const { orgId } = useCurrentOrg();
    const [agents, setAgents] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('year');

    const [showAgentModal, setShowAgentModal] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'Collaboratore',
        base_commission_percentage: '10',
        tax_regime: 'forfettario' // 'forfettario' | 'ordinario'
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load Data
    useEffect(() => {
        if (!orgId) return;
        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch Agents
            const { data: agentsData } = await supabase
                .from('agents')
                .select('*')
                .eq('organization_id', orgId)
                .order('first_name', { ascending: true });

            if (agentsData) setAgents(agentsData);

            // 2. Fetch All Income Transactions
            const { data: transData } = await supabase
                .from('transactions')
                .select('*')
                .eq('organization_id', orgId)
                .eq('type', 'income');

            if (transData) setTransactions(transData);

            // 3. Fetch Assignments (Incarichi)
            const { data: assignData } = await supabase
                .from('assignments')
                .select('*');
            // Note: assignments usually link to agents via agent_id. 
            // We should filter by org? assignments table usually doesn't have org_id directly if it's strictly linked to agent who is in org.
            // But let's check if we can filter. 
            // Ideally we fetch ALL assignments for agents in this org.
            // Since we have `agentsData`, we can filter assignments where `agent_id` is in `agentsData.ids`.
            // For simplicity, fetch all and filter in memory or fetch by agent IDs if RLS doesn't handle it.
            // Assuming RLS handles it or we filter. Let's fetch all for now or filter by implicit join?
            // Safest: Fetch all, they are likely limited.

            if (assignData) setAssignments(assignData);

            setLoading(false);
        };
        fetchData();
    }, [orgId]);

    const handleSaveAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;
        setIsSaving(true);

        try {
            if (editingId) {
                // UPDATE
                const { error } = await supabase
                    .from('agents')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        phone: formData.phone,
                        role: formData.role,
                        base_commission_percentage: parseFloat(formData.base_commission_percentage) || 0,
                        tax_regime: formData.tax_regime
                    })
                    .eq('id', editingId);

                if (error) throw error;

                setAgents(prev => prev.map(a => a.id === editingId ? { ...a, ...formData, base_commission_percentage: parseFloat(formData.base_commission_percentage) || 0 } : a));

            } else {
                // CREATE
                const { data, error } = await supabase
                    .from('agents')
                    .insert({
                        organization_id: orgId,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        phone: formData.phone,
                        role: formData.role,
                        base_commission_percentage: parseFloat(formData.base_commission_percentage) || 0,
                        tax_regime: formData.tax_regime
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (data) setAgents(prev => [...prev, data]);
            }

            setShowAgentModal(false);
            setEditingId(null);
        } catch (err: any) {
            console.error("Error saving agent:", err);
            alert(`Errore durante il salvataggio: ${err.message || JSON.stringify(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAgent = async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare l'agente ${name}? Questa azione è irreversibile.`)) return;

        try {
            // Check for linked transactions
            const { count: transCount, error: transErr } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('split_agent', id);

            // Check for linked assignments (Incarichi)
            const { count: assignCount, error: assignErr } = await supabase
                .from('assignments')
                .select('*', { count: 'exact', head: true })
                .eq('agent_id', id);

            const tCount = transCount || 0;
            const aCount = assignCount || 0;

            if (tCount > 0 || aCount > 0) {
                alert(`Impossibile eliminare l'agente poiché ci sono dati collegati:\n\n- ${tCount} Transazioni (Entrate/Uscite)\n- ${aCount} Incarichi/Assignments\n\nDevi prima eliminare o riassegnare questi elementi.`);
                return;
            }

            const { error } = await supabase.from('agents').delete().eq('id', id);
            if (error) throw error;
            setAgents(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            console.error(err);
            alert(`Impossibile eliminare l'agente. Errore: ${err.message || JSON.stringify(err)}`);
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            role: 'Collaboratore',
            base_commission_percentage: '10',
            tax_regime: 'forfettario'
        });
        setShowAgentModal(true);
    };

    const openEditModal = (agent: any) => {
        setEditingId(agent.id);
        setFormData({
            first_name: agent.first_name || '',
            last_name: agent.last_name || '',
            email: agent.email || '',
            phone: agent.phone || '',
            role: agent.role || 'Collaboratore',
            base_commission_percentage: agent.base_commission_percentage?.toString() || '0',
            tax_regime: agent.tax_regime || 'forfettario'
        });
        setShowAgentModal(true);
    };

    const closeModal = () => {
        setShowAgentModal(false);
        setEditingId(null);
    };

    // --- Analytics Logic ---
    const agentMetrics = useMemo(() => {
        if (!agents.length) return []; // Return empty if no agents

        // Date Filter Setup
        const now = new Date();
        const startOfRange = new Date();
        if (dateRange === 'month') startOfRange.setMonth(now.getMonth(), 1);
        if (dateRange === 'quarter') startOfRange.setMonth(now.getMonth() - 2, 1);
        if (dateRange === 'year') startOfRange.setFullYear(now.getFullYear(), 0, 1);
        if (dateRange === 'all') startOfRange.setFullYear(2000, 0, 1);
        startOfRange.setHours(0, 0, 0, 0);

        return agents.map(agent => {
            // 1. Deals where they are the SPLIT agent (Collaborator)
            const agentDeals = transactions.filter(t =>
                t.type === 'income' &&
                t.split_agent === agent.id &&
                new Date(t.date) >= startOfRange
            );

            // Total Revenue
            const totalRevenue = agentDeals.reduce((sum, t) => {
                const val = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
                return sum + (val || 0);
            }, 0);

            // Total Commissions
            const totalCommissions = agentDeals.reduce((sum, t) => {
                const val = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
                const pctVal = typeof t.split_percentage === 'string' ? parseFloat(t.split_percentage) : t.split_percentage;
                const pct = pctVal || 0;
                return sum + ((val * pct) / 100);
            }, 0);

            // Assignments Count
            const myAssignments = assignments.filter(a =>
                a.agent_id === agent.id &&
                new Date(a.assignment_date || a.created_at) >= startOfRange
            );

            return {
                ...agent,
                revenue: totalRevenue,
                commissions: totalCommissions,
                dealCount: agentDeals.length,
                assignmentCount: myAssignments.length
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [agents, transactions, assignments, dateRange]);

    const topRevenueAgent = agentMetrics.length > 0 ? agentMetrics[0] : null;
    const topAssignerAgent = agentMetrics.length > 0 ? [...agentMetrics].sort((a, b) => b.assignmentCount - a.assignmentCount)[0] : null;
    const topAgents = agentMetrics.slice(0, 3);

    // ... (rest of chart data logic if needed, or keeping it)
    const revenueChartData = useMemo(() => {
        return agentMetrics
            .filter(a => a.revenue > 0)
            .map(a => ({
                name: `${a.first_name} ${a.last_name}`,
                value: a.revenue
            }));
    }, [agentMetrics]);

    // Chart Data: Commission Distribution (Pie)
    const commissionPieData = useMemo(() => {
        return agentMetrics
            .filter(a => a.commissions > 0)
            .map(a => ({
                name: `${a.first_name} ${a.last_name}`,
                value: a.commissions
            }));
    }, [agentMetrics]);

    // ...

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
            {/* Stats Row - Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Revenue */}
                <div className="glass-card p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-background">
                            {topRevenueAgent ? `${topRevenueAgent.first_name[0]}${topRevenueAgent.last_name[0]}` : '-'}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mb-1">Top Performer (Fatturato)</p>
                            <h3 className="text-2xl font-black text-foreground">{topRevenueAgent ? `${topRevenueAgent.first_name} ${topRevenueAgent.last_name}` : 'N/D'}</h3>
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                                Generato: <span className="text-emerald-600 dark:text-emerald-400 font-bold">€ {topRevenueAgent?.revenue.toLocaleString('it-IT') || '0'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Assignments */}
                <div className="glass-card p-6 relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-transparent to-transparent border-violet-200/50 dark:border-violet-800/50">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BarChart3 className="w-24 h-24 text-violet-500" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 shadow-xl shadow-violet-500/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-background">
                            {topAssignerAgent ? `${topAssignerAgent.first_name[0]}${topAssignerAgent.last_name[0]}` : '-'}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400 tracking-wider mb-1">Top Performer (Incarichi)</p>
                            <h3 className="text-2xl font-black text-foreground">{topAssignerAgent ? `${topAssignerAgent.first_name} ${topAssignerAgent.last_name}` : 'N/D'}</h3>
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                                Incarichi Attivi/Chiusi: <span className="text-violet-600 dark:text-violet-400 font-bold">{topAssignerAgent?.assignmentCount || '0'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showAgentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b bg-muted/30">
                            <div>
                                <h3 className="font-bold text-xl">{editingId ? 'Modifica Agente' : 'Nuovo Agente'}</h3>
                                <p className="text-xs text-muted-foreground">Gestisci i dettagli del collaboratore.</p>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-muted transition-colors"><X className="w-5 h-5 opacity-50" /></button>
                        </div>
                        <form onSubmit={handleSaveAgent} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Nome</label>
                                    <input required type="text" className="input-premium w-full bg-muted/30" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="Mario" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Cognome</label>
                                    <input required type="text" className="input-premium w-full bg-muted/30" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="Rossi" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Email</label>
                                <input type="email" className="input-premium w-full bg-muted/30" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="mario.rossi@email.com" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Regime Fiscale</label>
                                    <select
                                        className="input-premium w-full h-11 bg-muted/30"
                                        value={formData.tax_regime}
                                        onChange={e => setFormData({ ...formData, tax_regime: e.target.value })}
                                    >
                                        <option value="forfettario">Forfettario (No IVA/Rit)</option>
                                        <option value="ordinario">Ordinario (IVA + Rit)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Ruolo</label>
                                    <select className="input-premium w-full h-11 bg-muted/30" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="Collaboratore">Collaboratore</option>
                                        <option value="Dipendente">Dipendente</option>
                                        <option value="Consulente">Consulente</option>
                                        <option value="Socio">Socio</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Commissione Base (%)</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            step="0.1"
                                            className="input-premium w-full bg-muted/30 font-bold text-right pr-8"
                                            value={formData.base_commission_percentage} // Updated field name
                                            onChange={e => setFormData({ ...formData, base_commission_percentage: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-2.5 text-muted-foreground font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 py-3 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Annulla</button>
                                <button type="submit" disabled={isSaving} className="flex-[2] btn-primary h-12 text-lg shadow-lg shadow-primary/20">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingId ? 'Salva Modifiche' : 'Crea Agente')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Gestione Agenti</h1>
                    <p className="text-muted-foreground font-medium">Performance del team e gestione collaboratori.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-4">
                    {/* Date Filter */}
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

                    <button
                        onClick={openCreateModal}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Nuovo Agente
                    </button>
                </div>
            </div>


            {/* --- Analytics Dashboard --- */}
            {!loading && transactions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">

                    {/* Leaderboard */}
                    <div className="glass-card p-6 border-l-4 border-l-yellow-400">
                        <div className="flex items-center gap-2 mb-6">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h3 className="font-bold text-lg">Top Performer (Fatturato)</h3>
                        </div>
                        <div className="space-y-4">
                            {topAgents.map((agent, i) => (
                                <div key={agent.id} className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border/50">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                        ${i === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' :
                                            i === 1 ? 'bg-zinc-100 text-zinc-700 ring-2 ring-zinc-400' :
                                                i === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400' : 'bg-muted text-muted-foreground'}
                                    `}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{agent.first_name} {agent.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{agent.dealCount} vendite</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">€ {agent.revenue.toLocaleString('it-IT')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Revenue Share Chart (Using Pie for clear distribution of total pot) */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            <h3 className="font-bold text-lg">Fatturato per Agente</h3>
                        </div>
                        <div className="h-[250px]">
                            {/* Reusing CategoryPieChart for Agent Revenue Share */}
                            <CategoryPieChart data={revenueChartData} height={250} />
                        </div>
                    </div>

                    {/* Commission Distribution Chart */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <PieChart className="w-6 h-6 text-purple-500" />
                            <h3 className="font-bold text-lg">Distribuzione Provvigioni</h3>
                        </div>
                        <div className="h-[250px]">
                            <CategoryPieChart data={commissionPieData} height={250} />
                        </div>
                    </div>

                </div>
            )}


            {/* Agents Grid */}
            <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Elenco Agenti
                </h2>
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                        Caricamento team...
                    </div>
                ) : agents.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        Non hai ancora aggiunto agenti.
                        <button onClick={openCreateModal} className="mt-4 text-primary font-bold underline">Aggiungine uno ora</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agentMetrics.map((agent: any) => (
                            <div key={agent.id} className="glass-card p-6 border hover:border-primary/50 transition-all duration-300 relative group">
                                <Link href={`/agenti/${agent.id}`} className="absolute inset-0 z-0" />

                                <div className="relative z-10 flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            {agent.first_name[0]}{agent.last_name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-none group-hover:text-primary transition-colors">
                                                {agent.first_name} {agent.last_name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                                                {agent.role || 'Collaboratore'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons (Stop Propagation to prevent navigation) */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(agent); }}
                                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-blue-600 transition-colors"
                                            title="Modifica"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAgent(agent.id, `${agent.first_name} ${agent.last_name}`); }}
                                            className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                                            title="Elimina"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mini Stats in Card */}
                                <div className="grid grid-cols-2 gap-2 mb-4 py-3 border-y border-border/50 relative z-0 pointer-events-none">
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Fatturato</p>
                                        <p className="text-sm font-bold">€ {agent.revenue.toLocaleString('it-IT')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Provvigioni</p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">€ {agent.commissions.toLocaleString('it-IT')}</p>
                                    </div>
                                </div>

                                <div className="space-y-1 relative z-0 pointer-events-none">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="w-3 h-3" /> {agent.phone || '-'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        <span>Base: <span className="font-bold text-emerald-600">{agent.base_commission_percentage || 0}%</span></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
