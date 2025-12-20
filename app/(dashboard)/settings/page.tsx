
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Shared client
import { Loader2, Save, Building, FileText, CheckCircle2 } from 'lucide-react';
import { CategoryManager } from '@/components/settings/CategoryManager';
import { TeamManager } from '@/components/settings/TeamManager';

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [orgId, setOrgId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        agency_name: '',
        address: '',
        vat_code: '',
        phone: '',
        email: '',
        website: '',
        logo_url: '',
        tax_regime: 'ordinario', // or 'forfettario'
        default_vat_rate: 22,
        revenue_limit: 85000,
        fiscal_year_start: '01-01'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get User
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Should redirect to login?

                // 2. Get Org ID
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (profile && profile.organization_id) {
                    setOrgId(profile.organization_id);

                    // 3. Get Settings
                    const { data: settings } = await supabase
                        .from('agency_settings')
                        .select('*')
                        .eq('organization_id', profile.organization_id)
                        .single();

                    if (settings) {
                        setFormData({
                            agency_name: settings.agency_name || '',
                            address: settings.address || '',
                            vat_code: settings.vat_code || '',
                            phone: settings.phone || '',
                            email: settings.email || '',
                            website: settings.website || '',
                            logo_url: settings.logo_url || '',
                            tax_regime: settings.tax_regime || 'ordinario',
                            default_vat_rate: settings.default_vat_rate ?? 22,
                            revenue_limit: settings.revenue_limit ?? 85000,
                            fiscal_year_start: settings.fiscal_year_start || '01-01'
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const [isError, setIsError] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        let newValue: string | number = value;

        if (type === 'number') {
            newValue = value === '' ? 0 : parseFloat(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage('');
        setIsError(false);

        if (!orgId) {
            setSaveMessage('Errore: Organizzazione non trovata.');
            setIsError(true);
            setIsSaving(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('agency_settings')
                .upsert({
                    organization_id: orgId,
                    ...formData
                }, { onConflict: 'organization_id' });

            if (error) throw error;

            setSaveMessage('Impostazioni aggiornate correttamente');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error: any) {
            console.error("Error saving settings:", error);
            setSaveMessage(`Errore: ${error.message || 'Errore sconosciuto'}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Impostazioni Agenzia</h1>
                <p className="text-muted-foreground mt-2">Configura i dati anagrafici e fiscali della tua attività.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-8">
                {/* ---------- ANAGRAFICA ---------- */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Building className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold">Anagrafica</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome Agenzia *</label>
                            <input
                                name="agency_name"
                                value={formData.agency_name}
                                onChange={handleChange}
                                required
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="Es. Immobiliare Futura"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Indirizzo Completo</label>
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="Via Roma 1, 00100 Roma"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">P.IVA / Codice Fiscale</label>
                            <input
                                name="vat_code"
                                value={formData.vat_code}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="IT00000000000"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefono</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="+39 333 1234567"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Principale</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="info@agenzia.it"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sito Web</label>
                            <input
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="www.agenzia.it"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">URL Logo</label>
                            <input
                                name="logo_url"
                                value={formData.logo_url}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">Inserisci l'URL dell'immagine del logo.</p>
                        </div>
                    </div>
                </div>

                {/* ---------- FISCALE ---------- */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold">Configurazione Fiscale</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Regime Fiscale</label>
                            <select
                                name="tax_regime"
                                value={formData.tax_regime}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                            >
                                <option value="ordinario">Ordinario (IVA Default)</option>
                                <option value="forfettario">Forfettario (No IVA)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aliquota IVA Predefinita (%)</label>
                            <input
                                name="default_vat_rate"
                                type="number"
                                value={formData.default_vat_rate}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Limite Fatturato Forfettario (€)</label>
                            <input
                                name="revenue_limit"
                                type="number"
                                value={formData.revenue_limit}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Inizio Anno Fiscale</label>
                            <input
                                name="fiscal_year_start"
                                type="text"
                                value={formData.fiscal_year_start}
                                onChange={handleChange}
                                className="w-full input-premium px-4 py-3 bg-muted/40 rounded-xl border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="MM-GG (es. 01-01)"
                            />
                        </div>
                    </div>
                </div>

                {/* ---------- ACTION BAR ---------- */}
                <div className="flex items-center justify-between pt-4">
                    <div>
                        {saveMessage && (
                            <div className={`flex items - center gap - 2 font - medium animate -in fade -in slide -in -from - bottom - 2 ${isError ? 'text-destructive' : 'text-green-500'} `}>
                                {isError ? <div className="h-5 w-5 font-bold">!</div> : <CheckCircle2 className="h-5 w-5" />}
                                {saveMessage}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
                    </button>
                </div>
            </form>

            <TeamManager />
            <CategoryManager />
        </div>
    );
}
