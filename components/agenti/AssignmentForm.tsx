"use client";

import { useEffect, useState } from 'react';
import { X, Save, ArrowRight, Loader2, Calendar, Euro, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import { cn } from '@/lib/utils';

interface AssignmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    agentId: string;
    initialData?: any; // For editing in future
}

export function AssignmentForm({ isOpen, onClose, onSuccess, agentId, initialData }: AssignmentFormProps) {
    const { orgId } = useCurrentOrg();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        status: 'active',
        estimated_value: '',
        agreed_commission_percentage: '',
        realized_value: '',
        acquisition_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    status: initialData.status || 'active',
                    estimated_value: initialData.estimated_value || '',
                    agreed_commission_percentage: initialData.agreed_commission_percentage || '',
                    realized_value: initialData.realized_value || '',
                    acquisition_date: initialData.acquisition_date || new Date().toISOString().split('T')[0],
                    end_date: initialData.end_date || '',
                    notes: initialData.notes || ''
                });
            } else {
                setFormData({
                    title: '',
                    status: 'active',
                    estimated_value: '',
                    agreed_commission_percentage: '',
                    realized_value: '',
                    acquisition_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    notes: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId || !agentId) return;
        setLoading(true);

        try {
            const payload = {
                organization_id: orgId,
                agent_id: agentId,
                title: formData.title,
                status: formData.status,
                estimated_value: parseFloat(formData.estimated_value) || 0,
                agreed_commission_percentage: parseFloat(formData.agreed_commission_percentage) || 0,
                realized_value: parseFloat(formData.realized_value) || 0,
                acquisition_date: formData.acquisition_date,
                end_date: formData.end_date || null,
                notes: formData.notes
            };

            if (initialData?.id) {
                // UPDATE
                const { error } = await supabase
                    .from('assignments')
                    .update(payload)
                    .eq('id', initialData.id);

                if (error) throw error;
            } else {
                // INSERT
                const { error } = await supabase
                    .from('assignments')
                    .insert([payload]);

                if (error) throw error;
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving assignment:", error);
            alert("Errore durante il salvataggio.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {initialData ? 'Modifica Incarico' : 'Nuovo Incarico'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            Titolo / Indirizzo
                        </label>
                        <div className="relative group">
                            <FileText className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Es. Vendita Villa Forte dei Marmi"
                                className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Value */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                Valore Stimato
                            </label>
                            <div className="relative group">
                                <Euro className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="number"
                                    value={formData.estimated_value}
                                    onChange={e => setFormData({ ...formData, estimated_value: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Realized Value */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ml-1">
                                Valore Venduto
                            </label>
                            <div className="relative group">
                                <Euro className="absolute left-3 top-2.5 w-5 h-5 text-emerald-500" />
                                <input
                                    type="number"
                                    value={formData.realized_value}
                                    onChange={e => setFormData({ ...formData, realized_value: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Agreed % */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                % Pattuita
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3 top-2.5 w-5 h-5 flex items-center justify-center font-bold text-muted-foreground">%</div>
                                <input
                                    type="number"
                                    value={formData.agreed_commission_percentage}
                                    onChange={e => setFormData({ ...formData, agreed_commission_percentage: e.target.value })}
                                    placeholder="Es. 3"
                                    className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                Data Inizio
                            </label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="date"
                                    required
                                    value={formData.acquisition_date}
                                    onChange={e => setFormData({ ...formData, acquisition_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                Data Fine
                            </label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>



                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            Stato Incarico
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['active', 'closed_won', 'expired'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status })}
                                    className={cn(
                                        "py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all flex items-center justify-center gap-1",
                                        formData.status === status
                                            ? status === 'active' ? "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300"
                                                : status === 'closed_won' ? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300"
                                                    : "bg-red-100 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300"
                                            : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    {status === 'active' && 'Attivo'}
                                    {status === 'closed_won' && 'Venduto'}
                                    {status === 'expired' && 'Scaduto'}
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                            Note
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Dettagli aggiuntivi..."
                            rows={3}
                            className="w-full px-4 py-3 bg-muted/40 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-border/50 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-3 px-4 rounded-xl font-bold btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/25 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salva Incarico
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
