"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Building2, Target, UserPlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function OnboardingWizard() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data State
    const [agencyData, setAgencyData] = useState({
        name: '',
        vat: '',
        address: '',
        regime: 'ordinario', // or 'forfettario'
        goalAnnual: ''
    });

    const [agentData, setAgentData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'agente_senior'
    });

    // Check if onboarding is needed (Secure API Check)
    useEffect(() => {
        const checkOnboarding = async () => {
            console.log("[Onboarding] STARTING CHECK via API...");
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // Call API check to bypass RLS
                const res = await fetch('/api/onboarding/check', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (!res.ok) throw new Error("API Check Failed");

                const data = await res.json();
                console.log("[Onboarding] API Response:", data);

                if (data.completed === false) {
                    console.log("[Onboarding] Opening Wizard (API confirmed)");
                    setAgencyData(prev => ({ ...prev, name: data.name || '' }));
                    setIsOpen(true);
                } else {
                    console.log("[Onboarding] Wizard not needed.");
                }

            } catch (e) {
                console.error("[Onboarding] Exception:", e);
            } finally {
                setLoading(false);
            }
        };
        checkOnboarding();
    }, []);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleFinish = async () => {
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // Use Secure API to save data (Bypasses RLS)
            const response = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    agencyData,
                    agentData
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "API Error");
            }

            console.log("[Onboarding] Setup Completed Successfully!");
            setIsOpen(false);
            window.location.reload();

        } catch (error: any) {
            console.error("Onboarding Error:", error);
            alert(`Errore: ${error.message || "Riprova"}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !isOpen) return null;

    return (
        // Custom Modal Overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-[600px] bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">

                {/* Header Graphic */}
                <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h2 className="text-3xl font-black relative z-10">Benvenuto in NO.IA 🚀</h2>
                    <p className="text-blue-100 mt-2 relative z-10">
                        Configuriamo la tua agenzia in 3 passaggi.
                    </p>

                    {/* Steps Indicator */}
                    <div className="flex items-center gap-2 mt-6 relative z-10">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`h-2 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                        ))}
                    </div>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider mb-2">
                                <Building2 className="w-4 h-4" /> Dati Agenzia
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome Agenzia</Label>
                                    <Input
                                        value={agencyData.name}
                                        onChange={e => setAgencyData({ ...agencyData, name: e.target.value })}
                                        placeholder="Es. Immobiliare Rossi"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>P.IVA</Label>
                                        <Input
                                            value={agencyData.vat}
                                            onChange={e => setAgencyData({ ...agencyData, vat: e.target.value })}
                                            placeholder="IT000..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Regime Fiscale</Label>
                                        {/* Native Select instead of Shadcn Select */}
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={agencyData.regime}
                                            onChange={e => setAgencyData({ ...agencyData, regime: e.target.value })}
                                        >
                                            <option value="ordinario">Ordinario (SRL/SAS)</option>
                                            <option value="forfettario">Forfettario</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Indirizzo Sede</Label>
                                    <Input
                                        value={agencyData.address}
                                        onChange={e => setAgencyData({ ...agencyData, address: e.target.value })}
                                        placeholder="Via Roma 1, Milano"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleNext} disabled={!agencyData.name}>Avanti</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider mb-2">
                                <Target className="w-4 h-4" /> Obiettivi
                            </div>

                            <div className="text-center py-6">
                                <h3 className="text-lg font-medium mb-2">Qual è il tuo obiettivo di fatturato quest'anno?</h3>
                                <p className="text-sm text-muted-foreground mb-6">Useremo questo dato per calcolare i tuoi progressi nella Dashboard.</p>

                                <div className="relative max-w-xs mx-auto">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">€</span>
                                    <Input
                                        type="number"
                                        className="pl-8 text-2xl font-bold h-16 text-center"
                                        placeholder="100000"
                                        value={agencyData.goalAnnual}
                                        onChange={e => setAgencyData({ ...agencyData, goalAnnual: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack}>Indietro</Button>
                                <Button onClick={handleNext}>Avanti</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider mb-2">
                                <UserPlus className="w-4 h-4" /> Primo Collaboratore
                            </div>

                            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm mb-4">
                                <p>Aggiungi subito un agente o un collaboratore. Se sei solo, puoi saltare questo passaggio.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        placeholder="Nome"
                                        value={agentData.firstName}
                                        onChange={e => setAgentData({ ...agentData, firstName: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Cognome"
                                        value={agentData.lastName}
                                        onChange={e => setAgentData({ ...agentData, lastName: e.target.value })}
                                    />
                                </div>
                                <Input
                                    placeholder="Email Collaboratore"
                                    type="email"
                                    value={agentData.email}
                                    onChange={e => setAgentData({ ...agentData, email: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-between pt-8">
                                <Button variant="ghost" onClick={handleBack}>Indietro</Button>
                                <Button onClick={handleFinish} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    {agentData.firstName ? 'Salva e Aggiungi Agente' : 'Salva e Termina'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
