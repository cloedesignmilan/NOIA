"use client";

import { useState, useEffect } from 'react';
import { X, Check, Euro, Receipt, Tag, Calendar, ScanLine, Loader2, Users, Building2, Megaphone, Laptop, Car, Scale, AlertCircle, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';

interface ExpenseFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: any;
}

const EXPENSE_MACROS = [
    { id: 'personale', label: 'Personale', icon: Users },
    { id: 'ufficio', label: 'Ufficio', icon: Building2 },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'tecnologia', label: 'Tecnologia', icon: Laptop },
    { id: 'trasporti', label: 'Trasporti', icon: Car },
    { id: 'fisco', label: 'Fisco', icon: Scale },
    { id: 'varie', label: 'Varie', icon: AlertCircle },
];

export function ExpenseForm({ isOpen, onClose, onSuccess, initialData }: ExpenseFormProps) {
    const { orgId, loading: orgLoading } = useCurrentOrg();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('paid');

    // Category
    const [macroCategory, setMacroCategory] = useState<string>('personale');
    const [category, setCategory] = useState<string>('');

    // Dynamic Lists
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

    // ... state 
    // VAT
    const [vatAmount, setVatAmount] = useState(0);
    const [vatRate, setVatRate] = useState(22); // Default 22
    const [taxRegime, setTaxRegime] = useState('ordinario');
    const [hasInvoice, setHasInvoice] = useState(false);

    // Fetch Categories & Settings
    useEffect(() => {
        if (!orgId || !isOpen) return;
        const fetchData = async () => {
            const [cats, settings] = await Promise.all([
                supabase.from('transaction_categories').select('*').eq('organization_id', orgId).eq('section', 'expense').order('name'),
                supabase.from('agency_settings').select('tax_regime, default_vat_rate').eq('organization_id', orgId).single()
            ]);

            if (cats.data) setCategoriesList(cats.data);
            if (settings.data) {
                setTaxRegime(settings.data.tax_regime || 'ordinario');
                if (settings.data.default_vat_rate) setVatRate(settings.data.default_vat_rate);
            }
        };
        fetchData();
    }, [orgId, isOpen]);

    // Calculate VAT
    useEffect(() => {
        const numericAmount = parseFloat(amount) || 0;
        // Logic: if hasInvoice, use vatRate. Amount is negative for storage but positive for UI. 
        // We handle sign at submit. UI shows positive.
        if (hasInvoice) {
            setVatAmount(numericAmount * (vatRate / 100)); // Positive VAT for display
        } else {
            setVatAmount(0);
        }
    }, [amount, taxRegime, hasInvoice, vatRate]);

    // Initialize Form Data
    useEffect(() => {
        if (isOpen && initialData) {
            const initAmount = initialData.amount ? Math.abs(initialData.amount) : 0;
            setAmount(initAmount.toString());

            // We recount VAT based on amount for now as discussed
            setDate(initialData.date || new Date().toISOString().split('T')[0]);
            setDescription(initialData.description || '');
            setStatus(initialData.status || 'paid');

            const initVat = Math.abs(initialData.vat_amount || 0);
            setHasInvoice(initVat > 0);

            // Reverse Calc VAT Rate if possible
            if (initVat > 0 && initAmount > 0) {
                const rate = Math.round((initVat / initAmount) * 100);
                setVatRate(rate);
            }

            const currentCat = initialData.category || '';
            let foundMacro = 'personale';

            // Logic to find macro (Simplified from original for robustness)
            // 1. Try "Macro - Name"
            const parts = currentCat.split(' - ');
            if (parts.length > 1 && EXPENSE_MACROS.some(m => m.label === parts[0])) {
                const m = EXPENSE_MACROS.find(m => m.label === parts[0]);
                if (m) foundMacro = m.id;
                setCategory(parts.slice(1).join(' - '));
            } else {
                // 2. Try simple match
                const match = categoriesList.find(c => c.name === currentCat);
                if (match) {
                    foundMacro = match.macro_category;
                    setCategory(currentCat);
                } else {
                    // If no match found, select nothing or default?
                    // Just clear it for now if we strictly enforce list
                    setCategory('');
                }
            }
            setMacroCategory(foundMacro);

        } else if (isOpen) {
            // Reset
            setAmount('');
            setVatAmount(0);
            setHasInvoice(false);
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
            setStatus('paid');
            setMacroCategory('personale');
            setCategory('');
        }
    }, [isOpen, initialData, categoriesList]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        let finalCategory = category;
        const macroObj = EXPENSE_MACROS.find(m => m.id === macroCategory);

        if (!finalCategory) { alert("Seleziona categoria"); return; }

        // Use "Macro - Name" format for DB consistency
        const fullCategoryName = `${macroObj?.label} - ${finalCategory}`;

        setIsLoading(true);
        try {
            const payload = {
                organization_id: orgId,
                type: 'expense',
                category: fullCategoryName,
                amount: parseFloat(amount) * -1, // Negative for expense
                vat_amount: vatAmount * -1, // Negative for expense
                date: date,
                description: description || `Spesa ${finalCategory}`,
                status: status,
            };

            if (initialData?.id) {
                await supabase.from('transactions').update(payload).eq('id', initialData.id);
            } else {
                await supabase.from('transactions').insert(payload);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Errore salvataggio");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-card sm:rounded-3xl rounded-t-3xl shadow-2xl border border-destructive/20 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between flex-shrink-0 bg-destructive/5">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{initialData ? 'Modifica Spesa' : 'Nuova Spesa'}</h2>
                        <p className="text-sm text-muted-foreground">Registra un costo o carica una fattura.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/50 text-muted-foreground transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* 1. Main Amount & Date */}
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Importo (€)</label>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-14 pl-4 pr-4 text-2xl font-bold bg-muted/30 border border-destructive/20 rounded-2xl text-destructive focus:ring-4 focus:ring-destructive/10 focus:border-destructive outline-none transition-all placeholder:text-muted-foreground/30"
                                autoFocus
                            />
                            {vatAmount > 0 && (
                                <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg inline-block">
                                    + IVA ({vatRate}%): €{vatAmount.toFixed(2)}
                                </div>
                            )}
                        </div>
                        <div className="w-full sm:w-40 space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Data</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full h-14 px-4 bg-muted/30 border border-border/50 rounded-2xl font-medium focus:ring-4 focus:ring-primary/10 outline-none"
                            />
                        </div>
                    </div>

                    {/* 2. Category */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Categoria</label>

                        {/* Macro Tabs */}
                        <div className="flex p-1.5 bg-muted/50 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
                            {EXPENSE_MACROS.map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMacroCategory(m.id)}
                                    className={cn(
                                        "flex-1 min-w-[80px] py-2 px-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex flex-col items-center gap-1",
                                        macroCategory === m.id ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground/80"
                                    )}
                                >
                                    <m.icon className="w-4 h-4 opacity-70" />
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Sub Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {categoriesList.filter(c => c.macro_category === macroCategory).map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => { setCategory(c.name); }}
                                    className={cn(
                                        "p-3 rounded-xl border text-sm font-medium text-left transition-all",
                                        category === c.name ? "border-destructive bg-destructive/5 text-destructive ring-1 ring-destructive/20" : "border-border/50 bg-background hover:bg-muted/50"
                                    )}
                                >
                                    {c.name}
                                </button>
                            ))}

                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Descrizione / Fornitore</label>
                            <input
                                type="text"
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Es. Affitto Ufficio, Bolletta Enel..."
                                className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:ring-4 focus:ring-primary/10 outline-none"
                            />
                        </div>

                        {/* Invoice Toggle */}
                        <div className={cn("transition-all duration-300 rounded-xl border border-border/50 overflow-hidden", hasInvoice ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : "bg-muted/20")}>
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setHasInvoice(!hasInvoice)}>
                                    <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", hasInvoice ? "bg-blue-500 border-blue-500 text-white" : "border-muted-foreground")}>
                                        {hasInvoice && <Check className="w-3 h-3" />}
                                    </div>
                                    <span className="text-sm font-medium">È presente fattura?</span>
                                </div>
                                {/* IVA Rate Input */}
                                {hasInvoice && (
                                    <div className="flex items-center gap-1 animate-in fade-in zoom-in">
                                        <span className="text-xs font-bold text-muted-foreground">IVA %</span>
                                        <input
                                            type="number"
                                            value={vatRate}
                                            onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                                            className="w-16 h-8 rounded-lg border border-blue-200 text-center text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {/* Status */}
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Stato</label>
                                <div className="flex bg-muted/50 p-1 rounded-xl gap-1">
                                    <button type="button" onClick={() => setStatus('paid')} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", status === 'paid' ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground")}>Pagato</button>
                                    <button type="button" onClick={() => setStatus('pending')} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", status === 'pending' ? "bg-orange-500 text-white shadow-sm" : "text-muted-foreground")}>Da Pagare</button>
                                </div>
                            </div>
                            {/* OCR Placeholder */}
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Allegato</label>
                                <button type="button" className="w-full h-[42px] border border-dashed border-border rounded-xl flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-muted/50">
                                    <ScanLine className="w-4 h-4 mr-2" /> Scansiona
                                </button>
                            </div>
                        </div>
                    </div>

                </form>

                <div className="p-6 border-t border-border/50 bg-background/50 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50 rounded-xl transition-colors">Annulla</button>
                    <button type="button" onClick={handleSubmit} disabled={isLoading} className="flex-[2] btn-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Salva Spesa <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </div>

            </div>
        </div>
    );
}
