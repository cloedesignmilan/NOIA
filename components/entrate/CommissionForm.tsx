"use client";

import { useState, useEffect } from 'react';
import {
    X, Check, Euro, Home, FileText, Tag, Loader2, Calendar, Handshake, PlusCircle,
    Pencil, Trash2, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';

interface CommissionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: any;
    readOnly?: boolean;
}

const INCOME_MACROS = [
    { id: 'provvigioni', label: 'Provvigioni immobiliari', icon: Home },
    { id: 'collaborazioni', label: 'Collaborazioni & segnalazioni', icon: Handshake },
    { id: 'servizi', label: 'Servizi accessori', icon: FileText },
    { id: 'extra', label: 'Extra / altri ricavi', icon: PlusCircle },
];

export function CommissionForm({ isOpen, onClose, onSuccess, initialData, readOnly = false }: CommissionFormProps) {
    const { orgId, loading: orgLoading } = useCurrentOrg();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('pending');

    // Category
    const [macroCategory, setMacroCategory] = useState('provvigioni');
    const [category, setCategory] = useState('');

    // Details
    const [clientName, setClientName] = useState('');
    const [propertyAddr, setPropertyAddr] = useState('');

    // Extra
    const [invoiceNum, setInvoiceNum] = useState('');
    const [hasInvoice, setHasInvoice] = useState(false);
    const [hasSplit, setHasSplit] = useState(false);
    const [splitAgent, setSplitAgent] = useState('');
    const [splitPercentage, setSplitPercentage] = useState('');

    // Lists
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

    // VAT & Withholding
    const [vatAmount, setVatAmount] = useState(0);
    const [vatRate, setVatRate] = useState(22); // Default 22%
    const [withholdingTax, setWithholdingTax] = useState(0); // Ritenuta
    const [applyWithholding, setApplyWithholding] = useState(false);
    const [taxRegime, setTaxRegime] = useState('ordinario');

    // Data Fetching
    useEffect(() => {
        if (!orgId || !isOpen) return;

        async function loadData() {
            const [cats, agts, settings] = await Promise.all([
                supabase.from('transaction_categories').select('*').eq('organization_id', orgId).eq('section', 'income').order('name'),
                supabase.from('agents').select('*').eq('organization_id', orgId).eq('active', true).order('first_name'),
                supabase.from('agency_settings').select('tax_regime, default_vat_rate').eq('organization_id', orgId).single()
            ]);

            if (cats.data) setCategoriesList(cats.data);
            if (agts.data) setAgents(agts.data);
            if (settings.data) {
                setTaxRegime(settings.data.tax_regime || 'ordinario');
                if (settings.data.default_vat_rate) setVatRate(settings.data.default_vat_rate);
            }
        }
        loadData();
    }, [orgId, isOpen]);

    // Calculate VAT & Withholding
    useEffect(() => {
        const numericAmount = parseFloat(amount) || 0;

        // VAT: Ordinario + Invoice Issued OR just Invoice Issued toggle (user requested override ability)
        // If hasInvoice is true, we calculate VAT based on vatRate. 
        // We allow it even if not "ordinario" if the user explicitly enabled invoice, but technically forfettario is 0%.
        // Prompt says "se selezioni presente fattura inserisci il 22% di default ma dai la possibilità di cambiare".
        if (hasInvoice) {
            setVatAmount(numericAmount * (vatRate / 100));
        } else {
            setVatAmount(0);
        }

        // Withholding: Ordinario + Toggle Checked
        // 23% on 50% of Taxable Base (amount)
        if (taxRegime === 'ordinario' && applyWithholding) {
            const taxableBase = numericAmount * 0.50;
            setWithholdingTax(taxableBase * 0.23);
        } else {
            setWithholdingTax(0);
        }

    }, [amount, taxRegime, hasInvoice, applyWithholding, vatRate]);

    // Auto-Generate Invoice Number
    useEffect(() => {
        // Only run if:
        // 1. Invoice is enabled
        // 2. We don't have a manually entered number OR we want to re-calculate on year change (careful not to overwrite user input if they typed something custom? 
        //    Actually, better to overwrite if it's auto-generated, but if user typed, maybe don't? 
        //    Let's assume if it's "clean" or looks "auto-generated" we can update. 
        //    Simpler: If `hasInvoice` is true, and (invoiceNum is empty OR it matches a different year pattern), we generate.
        //    Actually, just generating on Date change if hasInvoice is active is safest for the "reset" requirement.

        if (hasInvoice && orgId && date) {
            const generateNumber = async () => {
                const selectedYear = new Date(date).getFullYear();
                const yearSuffix = `-${selectedYear}`;

                // Check if current invoiceNum matches the selected year. If so, and we didn't just toggle, maybe we keep it?
                // But if user changes date from 2024 to 2025, we MUST update.
                // Let's check DB for max number for calculateYear.

                // Fetch max invoice number for this year
                const { data, error } = await supabase
                    .from('transactions')
                    .select('invoice_number')
                    .eq('organization_id', orgId)
                    .ilike('invoice_number', `%${yearSuffix}`)
                    .order('invoice_number', { ascending: false });

                if (error) {
                    console.error("Error fetching invoices:", error);
                    return;
                }

                let maxNum = 0;
                if (data && data.length > 0) {
                    // Parse max number in format XX-YYYY
                    data.forEach(t => {
                        if (!t.invoice_number) return;
                        // Handle potential spaces like " 01 - 2025 "
                        const parts = t.invoice_number.split('-').map((p: string) => p.trim());

                        if (parts?.length === 2) {
                            // Check if second part is the year
                            if (parts[1] == selectedYear.toString()) {
                                const n = parseInt(parts[0]);
                                if (!isNaN(n) && n > maxNum) maxNum = n;
                            }
                        }
                    });
                }

                const nextNum = maxNum + 1;
                const padded = nextNum.toString().padStart(2, '0');
                const newInvoiceNum = `${padded}-${selectedYear}`;

                // Only update if it's different to avoid loops/overwrites of manual edits if same year?
                // But if user manually types "05-2025" and system thinks next is "03-2025", we might overwrite.
                // For now, let's just set it. The user can edit afterwards if needed.
                // We check if current invoiceNum ALREADY ends in this year and looks sequential?
                // Let's just set it. It's an "Auto" feature.
                if (invoiceNum !== newInvoiceNum) {
                    setInvoiceNum(newInvoiceNum);
                }
            };
            generateNumber();
        }
    }, [hasInvoice, orgId, date]); // Run when hasInvoice AND date changes


    // Populate Form
    useEffect(() => {
        if (isOpen && initialData) {
            setAmount(initialData.amount?.toString() || '');

            const initVat = initialData.vat_amount || 0;
            const initAmount = initialData.amount || 0;
            const initWithholding = initialData.withholding_tax || 0;

            // Infer switches
            setInvoiceNum(initialData.invoice_number || '');
            setHasInvoice(!!initialData.invoice_number || initVat > 0);

            // Reverse Calc VAT Rate if possible
            if (initVat > 0 && initAmount > 0) {
                const rate = Math.round((initVat / initAmount) * 100);
                setVatRate(rate);
            }

            // Logic for Apply Withholding
            setApplyWithholding(initWithholding > 0);

            setDate(initialData.date || new Date().toISOString().split('T')[0]);
            setStatus(initialData.status || 'pending');
            // ... (rest of populate logic)
            setSplitAgent(initialData.split_agent || '');
            setSplitPercentage(initialData.split_percentage?.toString() || '');
            setHasSplit(!!initialData.split_agent);

            // Category Parsing (Simpler Logic)
            const currentCat = initialData.category || '';
            let foundMacro = 'provvigioni';

            // Try to match macro based on known keywords or list
            const match = categoriesList.find(c => c.name === currentCat);
            if (match) {
                foundMacro = match.macro_category;
                setCategory(currentCat);
                setCategory(currentCat);
            } else {
                if (currentCat.toLowerCase().includes('servizi')) foundMacro = 'servizi';
                else if (currentCat.toLowerCase().includes('flusso')) foundMacro = 'flusso';

                // If not standard, clear or handle differently. For now clear.
                setCategory('');
            }
            setMacroCategory(foundMacro);

            // Desc Parsing
            const desc = initialData.description || '';
            // Try to extract Property and Client if form "Cat - Prop (Client)"
            // Heuristic: Last parenthesized part is client.
            const lastParen = desc.lastIndexOf('(');
            const closeParen = desc.lastIndexOf(')');
            if (lastParen > -1 && closeParen > lastParen) {
                setClientName(desc.substring(lastParen + 1, closeParen).trim());
                // Property is before that, maybe after " - "
                const dashIndex = desc.indexOf(' - ');
                if (dashIndex > -1 && dashIndex < lastParen) {
                    setPropertyAddr(desc.substring(dashIndex + 3, lastParen).trim());
                } else {
                    setPropertyAddr(desc.substring(0, lastParen).trim());
                }
            } else {
                setPropertyAddr(desc); // Fallback
            }

        } else if (isOpen) {
            // Reset
            setAmount('');
            setVatAmount(0); // Reset VAT
            setVatRate(22); // Reset VAT Rate
            setWithholdingTax(0);
            setApplyWithholding(false);
            setDate(new Date().toISOString().split('T')[0]);
            setStatus('pending');
            setMacroCategory('provvigioni');
            setCategory('');
            setClientName('');
            setPropertyAddr('');
            setInvoiceNum('');
            setHasInvoice(false);
            setSplitAgent('');
            setSplitPercentage('');
            setHasSplit(false);
        }
    }, [isOpen, initialData, categoriesList]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly || !orgId) return;

        let finalCategory = category;
        if (!finalCategory) { alert("Seleziona categoria"); return; }

        setIsLoading(true);
        const desc = `${finalCategory} - ${propertyAddr} ${clientName ? `(${clientName})` : ''}`;

        // Prepare Income Payload
        const incomeVal = parseFloat(amount) || 0;
        let agentCommission = 0;
        let agentIdToLink = null;

        if (hasSplit && splitAgent) {
            const pct = parseFloat(splitPercentage) || 0;
            agentCommission = (Math.abs(incomeVal) * pct) / 100;
            agentIdToLink = splitAgent;
        }

        console.log("Saving Transaction:", {
            hasSplit, splitAgent, splitPercentage,
            agentIdToLink, agentCommission
        });



        const incomePayload = {
            organization_id: orgId,
            type: 'income',
            amount: incomeVal,
            vat_amount: vatAmount,
            withholding_tax: withholdingTax,
            date: date,
            category: finalCategory,
            description: desc,
            status: status,
            invoice_number: hasInvoice ? invoiceNum : null,
            split_agent: hasSplit ? splitAgent : null, // We still store string for reference
            split_percentage: hasSplit ? parseFloat(splitPercentage) : null,
            // LINK TO AGENT
            agent_id: agentIdToLink,
            agent_commission_accrued: agentCommission,
            agent_commission_status: 'accrued'
        };

        try {
            let incomeId: string | null = null;

            // 1. Upsert Income Transaction
            if (initialData?.id) {
                const { data, error } = await supabase
                    .from('transactions')
                    .update(incomePayload)
                    .eq('id', initialData.id)
                    .select()
                    .single();

                if (error) throw error;
                incomeId = data.id;
            } else {
                const { data, error } = await supabase
                    .from('transactions')
                    .insert(incomePayload)
                    .select()
                    .single();

                if (error) throw error;
                incomeId = data.id;
            }

            if (!incomeId) throw new Error("No income ID returned");

            // 2. Handle Split Expense Logic
            // incomeVal is already defined above

            // Check if an expense already links to this income (for Updates)
            const { data: existingExp } = await supabase
                .from('transactions')
                .select('id')
                .eq('related_transaction_id', incomeId)
                .maybeSingle();

            if (hasSplit && splitAgent && splitPercentage) {
                // --- Handle SPLIT (Agent Commission) ---
                // Logic:
                // 1. Calculate Base Commission
                // 2. Check Agent Regime (Forfettario vs Ordinario)
                // 3. If Ordinario: Add VAT (22%) and Withholding (20%)

                const pct = parseFloat(splitPercentage) || 0;
                const baseCommission = (Math.abs(incomeVal) * pct) / 100;

                // Resolve Agent by ID
                const agtObj = agents.find(a => a.id === splitAgent);
                const agentName = agtObj ? `${agtObj.first_name} ${agtObj.last_name}` : 'Collaboratore';
                const isOrdinario = agtObj?.tax_regime === 'ordinario';

                let agentVat = 0;
                let agentWithholding = 0;
                let totalExpense = baseCommission;

                if (isOrdinario) {
                    agentVat = baseCommission * 0.22;       // 22% IVA
                    agentWithholding = baseCommission * 0.20; // 20% Ritenuta d'Acconto
                    totalExpense = baseCommission + agentVat; // Expense matches Invoice Total (Base + VAT)
                }

                const expensePayload = {
                    organization_id: orgId,
                    date: date,
                    amount: -Math.abs(totalExpense), // Negative because it's an expense
                    description: `Competenza ${agentName} su ${desc} (${isOrdinario ? 'Ord.' : 'Forf.'})`,
                    category: 'Personale - 1.2 Provvigioni Agenti Esterni',
                    type: 'expense',
                    related_transaction_id: incomeId,
                    vat_amount: agentVat,
                    withholding_tax: agentWithholding,
                    split_agent: splitAgent // Store ID for analytics
                };

                if (existingExp) {
                    // Update existing
                    await supabase.from('transactions').update(expensePayload).eq('id', existingExp.id);
                } else {
                    // Insert new
                    await supabase.from('transactions').insert(expensePayload);
                }

            } else {
                // If NO Split (or removed), we must delete any existing linked expense
                if (incomeId) {
                    await supabase
                        .from('transactions')
                        .delete()
                        .eq('related_transaction_id', incomeId);
                }
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
            <div className="relative w-full max-w-2xl bg-card sm:rounded-3xl rounded-t-3xl shadow-2xl border border-border/50 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between flex-shrink-0 bg-muted/20">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{initialData ? 'Modifica Entrata' : 'Nuova Entrata'}</h2>
                        <p className="text-sm text-muted-foreground">Registra un nuovo movimento in entrata.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <fieldset disabled={readOnly} className="space-y-8">

                        {/* Main Amount & Date */}
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Importo (€)</label>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-14 pl-4 pr-4 text-2xl font-bold bg-muted/30 border border-destructive/20 rounded-2xl text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all placeholder:text-muted-foreground/30"
                                    autoFocus
                                />
                                {/* Summary Chips */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {vatAmount > 0 && (
                                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold border border-blue-100">
                                            + IVA: €{vatAmount.toFixed(2)}
                                        </span>
                                    )}
                                    {withholdingTax > 0 && (
                                        <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-md font-bold border border-orange-100">
                                            - Ritenuta: €{withholdingTax.toFixed(2)}
                                        </span>
                                    )}
                                </div>
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

                        {/* Invoice & Withholding Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Invoice Toggle */}
                            <div className={cn("transition-all duration-300 rounded-xl border border-border/50 overflow-hidden", hasInvoice ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : "bg-muted/20")}>
                                <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setHasInvoice(!hasInvoice)}>
                                    <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", hasInvoice ? "bg-blue-500 border-blue-500 text-white" : "border-muted-foreground")}>
                                        {hasInvoice && <Check className="w-3 h-3" />}
                                    </div>
                                    <span className="text-sm font-medium">È stata emessa fattura?</span>
                                    {hasInvoice && (
                                        <div className="relative ml-auto flex items-center">
                                            <input
                                                type="number"
                                                value={vatRate}
                                                onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                                                className="w-16 h-8 px-2 rounded-md bg-background border border-blue-200 dark:border-blue-800 text-sm text-right"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="absolute right-2 text-xs font-bold text-muted-foreground">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Withholding Toggle - Only for Ordinario */}
                            {taxRegime === 'ordinario' && (
                                <div className={cn("transition-all duration-300 rounded-xl border border-border/50 overflow-hidden", applyWithholding ? "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800" : "bg-muted/20")}>
                                    <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setApplyWithholding(!applyWithholding)}>
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", applyWithholding ? "bg-orange-500 border-orange-500 text-white" : "border-muted-foreground")}>
                                            {applyWithholding && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm font-medium">Applica Ritenuta d'Acconto?</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Invoice Number (If Invoice is Check) */}
                        {hasInvoice && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Numero Fattura</label>
                                <input
                                    type="text"
                                    value={invoiceNum}
                                    onChange={e => setInvoiceNum(e.target.value)}
                                    placeholder="Es. 12/2024"
                                    className="w-full h-11 px-4 rounded-xl bg-background border border-border/50 focus:ring-4 focus:ring-primary/10 outline-none"
                                />
                            </div>
                        )}
                        {/* 2. Category Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Categoria Operazione</label>

                            {/* Tabs */}
                            <div className="flex p-1.5 bg-muted/50 rounded-2xl gap-1 overflow-x-auto">
                                {INCOME_MACROS.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setMacroCategory(m.id)}
                                        title={m.label}
                                        className={cn(
                                            "flex-1 min-w-[50px] py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1",
                                            macroCategory === m.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                        )}
                                    >
                                        <m.icon className="w-5 h-5 opacity-90" />
                                    </button>
                                ))}
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {categoriesList.filter(c => c.macro_category === macroCategory).map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => { setCategory(c.name); }}
                                        className={cn(
                                            "p-3 rounded-xl border text-sm font-medium text-left transition-all",
                                            category === c.name ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20" : "border-border/50 bg-background hover:bg-muted/50"
                                        )}
                                    >
                                        {c.name}
                                    </button>
                                ))}

                            </div>

                            {/* 3. Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Proprietà / Riferimento</label>
                                    <input
                                        type="text"
                                        required
                                        value={propertyAddr}
                                        onChange={e => setPropertyAddr(e.target.value)}
                                        placeholder="Es. Via Roma 12"
                                        className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:ring-4 focus:ring-primary/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                        placeholder="Es. Mario Rossi"
                                        className="w-full h-12 px-4 rounded-xl bg-muted/30 border border-border/50 focus:ring-4 focus:ring-primary/10 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-border/50" />

                            {/* 4. Options toggles */}
                            <div className="flex flex-col gap-4">
                                {/* Status */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                                    <span className="text-sm font-medium">Stato Incasso</span>
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <button type="button" onClick={() => setStatus('pending')} className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", status === 'pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40" : "text-muted-foreground")}>In Attesa</button>
                                        <button type="button" onClick={() => setStatus('paid')} className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", status === 'paid' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40" : "text-muted-foreground")}>Incassato</button>
                                    </div>
                                </div>



                                {/* Split */}
                                <div className={cn("transition-all duration-300 rounded-xl border border-border/50 overflow-hidden", hasSplit ? "bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800" : "bg-muted/20")}>
                                    <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setHasSplit(!hasSplit)}>
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", hasSplit ? "bg-purple-500 border-purple-500 text-white" : "border-muted-foreground")}>
                                            {hasSplit && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm font-medium">Collaborazione Agente</span>
                                    </div>
                                    {hasSplit && (
                                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 grid grid-cols-3 gap-2">
                                            <select
                                                value={splitAgent}
                                                onChange={e => {
                                                    const selectedId = e.target.value;
                                                    setSplitAgent(selectedId);
                                                    // Auto-set default percentage
                                                    const agt = agents.find(a => a.id === selectedId);
                                                    if (agt) {
                                                        const def = agt.base_commission_percentage || agt.commission_percentage;
                                                        if (def) setSplitPercentage(def.toString());
                                                        else setSplitPercentage('50');
                                                    }
                                                }}
                                                className="col-span-2 h-10 px-3 rounded-lg bg-background border border-purple-200 dark:border-purple-800 text-sm"
                                            >
                                                <option value="">Seleziona Agente...</option>
                                                {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                                            </select>
                                            <div className="relative">
                                                <input type="number" value={splitPercentage} onChange={e => setSplitPercentage(e.target.value)} className="w-full h-10 px-3 pr-6 rounded-lg bg-background border border-purple-200 dark:border-purple-800 text-sm" placeholder="%" />
                                                <span className="absolute right-2 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </fieldset>
                </form>

                <div className="p-6 border-t border-border/50 bg-background/50 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-muted-foreground hover:bg-muted/50 rounded-xl transition-colors">Annulla</button>
                    {!readOnly && (
                        <button type="button" onClick={handleSubmit} disabled={isLoading} className="flex-[2] btn-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Salva Operazione <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
