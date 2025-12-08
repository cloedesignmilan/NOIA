
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, TrendingUp, Filter, Loader2, Pencil, Trash2, Eye, FileText, Wallet, Clock, Activity, ArrowUpRight, AlertCircle } from 'lucide-react';
import { CommissionForm } from '@/components/entrate/CommissionForm';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { TrendChart } from '@/components/charts/TrendChart';

export default function EntratePage() {
    const { orgId } = useCurrentOrg();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [viewMode, setViewMode] = useState(false);

    // Filter State
    const [filterCategory, setFilterCategory] = useState("all");
    const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('year');

    const fetchTransactions = async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', orgId)
            .eq('type', 'income')
            .order('date', { ascending: false });

        if (error) {
            console.error("Error fetching transactions:", error);
        } else if (data) {
            setTransactions(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [orgId]);

    const handleEdit = (transaction: any) => {
        setSelectedTransaction(transaction);
        setViewMode(false);
        setIsFormOpen(true);
    };

    const handleView = (transaction: any) => {
        setSelectedTransaction(transaction);
        setViewMode(true);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Sei sicuro di voler eliminare questa operazione?")) return;

        const { error } = await supabase.from('transactions').delete().eq('id', id);

        if (error) {
            alert("Errore durante l'eliminazione");
        } else {
            fetchTransactions();
        }
    };

    const handleNewOperation = () => {
        setSelectedTransaction(null);
        setViewMode(false);
        setIsFormOpen(true);
    };

    // --- Filtering Logic ---
    const uniqueCategories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean))).sort();

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        // Date Filter
        const now = new Date();
        const startOfRange = new Date();
        if (dateRange === 'month') startOfRange.setMonth(now.getMonth(), 1);
        if (dateRange === 'quarter') startOfRange.setMonth(now.getMonth() - 2, 1);
        if (dateRange === 'year') startOfRange.setFullYear(now.getFullYear(), 0, 1);
        if (dateRange === 'all') startOfRange.setFullYear(2000, 0, 1);
        startOfRange.setHours(0, 0, 0, 0);

        filtered = filtered.filter(t => new Date(t.date) >= startOfRange);

        // Category Filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(t => t.category === filterCategory);
        }

        return filtered;
    }, [transactions, filterCategory, dateRange]);


    // --- Derived Metrics ---
    const metrics = useMemo(() => {
        // Gross Income is sum of amount
        const grossIncome = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalVat = filteredTransactions.reduce((sum, t) => sum + (t.vat_amount || 0), 0);
        const totalWithholding = filteredTransactions.reduce((sum, t) => sum + (t.withholding_tax || 0), 0);

        // Net Income (User Req: Taxable - Withholding)
        const netIncome = grossIncome - totalWithholding;

        const pending = filteredTransactions.filter(t => t.status === 'pending');
        const pendingAmount = pending.reduce((sum, t) => sum + (t.amount || 0), 0);
        const avgTransaction = filteredTransactions.length > 0 ? grossIncome / filteredTransactions.length : 0;

        // Find top category
        const catMap = new Map<string, number>();
        filteredTransactions.forEach(t => {
            const c = t.category || 'Altro';
            catMap.set(c, (catMap.get(c) || 0) + t.amount);
        });
        let topCat = '-';
        let topCatVal = 0;
        catMap.forEach((val, key) => {
            if (val > topCatVal) {
                topCatVal = val;
                topCat = key;
            }
        });

        return { totalIncome: netIncome, totalVat, totalWithholding, pendingAmount, avgTransaction, topCat };
    }, [filteredTransactions]);


    // --- Chart Data ---
    const trendData = useMemo(() => {
        const map = new Map<string, number>();
        // Group by Month
        filteredTransactions.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()} -${d.getMonth() + 1} `;
            map.set(key, (map.get(key) || 0) + (t.amount || 0));
        });

        return Array.from(map.entries())
            .map(([key, value]) => {
                const [y, m] = key.split('-');
                return {
                    name: new Date(parseInt(y), parseInt(m) - 1).toLocaleString('it-IT', { month: 'short', year: '2-digit' }),
                    value: value,
                    date: new Date(parseInt(y), parseInt(m) - 1)
                };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [filteredTransactions]);

    const pieData = useMemo(() => {
        const map = new Map<string, number>();
        filteredTransactions.forEach((t: any) => {
            const cat = t.category || "Altro";
            map.set(cat, (map.get(cat) || 0) + (t.amount || 0));
        });

        return Array.from(map.entries()).map(([name, value]) => ({
            name,
            value: value
        })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);


    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        Entrate
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            + {filteredTransactions.length} Movimenti
                        </span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Gestione incassi, fatture e commissioni.</p>
                </div>

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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="widget-premium bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Totale Entrate</p>
                        <Wallet className="w-4 h-4 text-emerald-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">€ {metrics.totalIncome.toLocaleString('it-IT')}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Incassato nel periodo</p>
                </div>

                <div className="widget-premium bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Totale IVA</p>
                        <AlertCircle className="w-4 h-4 text-blue-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">€ {metrics.totalVat.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">IVA da versare</p>
                </div>

                <div className="widget-premium bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50 dark:border-orange-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400 tracking-wider">Ritenute Acconto</p>
                        <Activity className="w-4 h-4 text-orange-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">€ {metrics.totalWithholding.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Credito d'imposta</p>
                </div>

                <div className="widget-premium bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">Da Incassare</p>
                        <Clock className="w-4 h-4 text-amber-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400">
                        € {metrics.pendingAmount.toLocaleString('it-IT')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Fatture emesse o sospesi</p>
                </div>

                <div className="widget-premium bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Media Transazione</p>
                        <Activity className="w-4 h-4 text-blue-500 opacity-70" />
                    </div>
                    <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400">
                        € {metrics.avgTransaction.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Valore medio operazione</p>
                </div>

                <div className="glass-card p-4 flex flex-col justify-center items-center text-center border-l-4 border-l-primary">
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">Top Categoria</p>
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-tight">{metrics.topCat}</h3>
                </div>
            </div>


            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 min-h-[350px]">
                    <h3 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Andamento Entrate
                    </h3>
                    <div className="w-full h-[300px]">
                        {trendData.length > 0 ? (
                            <TrendChart data={trendData} dataKey="value" colors={{ stroke: '#10b981', fill: '#d1fae5' }} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">Nessun dato.</div>
                        )}
                    </div>
                </div>
                <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 text-foreground">Distribuzione</h3>
                    <div className="w-full h-[300px]">
                        {pieData.length > 0 ? (
                            <CategoryPieChart data={pieData} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">Nessun dato.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="glass-card overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-5 border-b border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cerca..."
                                className="pl-9 pr-4 py-2 h-10 w-40 sm:w-64 rounded-xl bg-background border border-border/60 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>
                        <div className="relative hidden md:block">
                            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="pl-9 pr-8 py-2 h-10 rounded-xl bg-background border border-border/60 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer outline-none appearance-none"
                            >
                                <option value="all">Tutte le Categorie</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleNewOperation}
                        className="btn-primary shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/30 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nuova Entrata
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                        <p>Caricamento dati...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold text-lg">Nessun risultato</h3>
                        <p className="text-sm">Non ci sono entrate per i filtri selezionati.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30 text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Descrizione</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4 text-right">Imponibile</th>
                                    <th className="px-6 py-4 text-right">Ritenuta</th>
                                    <th className="px-6 py-4 text-right">IVA</th>
                                    <th className="px-6 py-4 text-center">Stato</th>
                                    <th className="px-6 py-4 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredTransactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        onClick={() => handleView(t)}
                                        className="group hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-medium whitespace-nowrap text-muted-foreground">
                                            {new Date(t.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-foreground line-clamp-1">{t.description}</p>
                                            {t.invoice_number && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Ft. {t.invoice_number}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-secondary-foreground/10">
                                                {t.category || 'Generale'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                € {t.amount?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {t.withholding_tax ? (
                                                <span className="font-medium text-orange-600 dark:text-orange-400">
                                                    - € {t.withholding_tax.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : <span className="text-muted-foreground">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {t.vat_amount ? (
                                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                                    + € {t.vat_amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : <span className="text-muted-foreground">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {t.status === 'pending' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                    In Attesa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                    Incassato
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                                    className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(t.id, e)}
                                                    className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <CommissionForm
                isOpen={isFormOpen}
                initialData={selectedTransaction}
                readOnly={viewMode}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchTransactions}
            />
        </div>
    );
}
