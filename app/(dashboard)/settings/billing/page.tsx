"use client";

import { Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Placeholder Plan IDs - You MUST create these in PayPal Developer Dashboard -> App -> Subscriptions -> Plans
// For now, these are dummy placeholders. The buttons won't fully work without real Plan IDs from your PayPal account.
const PAYPAL_PLAN_IDS = {
    standard_monthly: 'P-MONTHLY-PLACEHOLDER',
    standard_annual: 'P-ANNUAL-PLACEHOLDER'
};

export default function BillingPage() {
    const { orgId } = useCurrentOrg();
    const [currentPlan, setCurrentPlan] = useState<string>('start');
    const [status, setStatus] = useState<string>('trial');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    useEffect(() => {
        if (!orgId) return;
        const fetchPlan = async () => {
            const { data } = await supabase
                .from('organizations')
                .select('subscription_status, plan_tier')
                .eq('id', orgId)
                .single();
            if (data) {
                setStatus(data.subscription_status || 'trial');
                setCurrentPlan(data.plan_tier || 'start');
            }
        };
        fetchPlan();
    }, [orgId]);

    const handleApprove = async (data: any, actions: any) => {
        if (!selectedPlan || !orgId) return;
        try {
            const subscriptionId = data.subscriptionID;

            // Call API to update DB
            const res = await fetch('/api/billing/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan,
                    subscriptionId: subscriptionId,
                    organizationId: orgId
                })
            });

            if (!res.ok) throw new Error("Update failed");

            alert("Abbonamento attivato con successo!");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Errore durante l'attivazione. Contatta il supporto.");
        }
    };

    const plans = [
        {
            id: 'standard_monthly',
            name: 'Mensile',
            price: '99',
            period: '/mese',
            agents: 'Agenti Illimitati',
            features: [
                'Tutte le funzionalità incluse',
                'Entrate & Uscite Illimitate',
                'Dashboard Avanzata & Report PDF',
                'Gestione Team Completa',
                'Supporto Prioritario dedicated'
            ],
            popular: false
        },
        {
            id: 'standard_annual',
            name: 'Annuale',
            price: '990',
            period: '/anno',
            agents: 'Agenti Illimitati',
            features: [
                'Tutte le funzionalità incluse',
                '2 MESI GRATIS (Risparmi 198€)',
                'Priority Lane per nuove feature',
                'Setup Assistito Gratuito',
                'Tutto quello presente nel mensile'
            ],
            popular: true
        }
    ];

    return (
        <PayPalScriptProvider options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
            currency: "EUR",
            intent: "subscription",
            vault: true
        }}>
            <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32">
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight">Scegli il piano perfetto per la tua agenzia</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Tutti i piani includono 30 giorni di prova gratuita. Nessun costo nascosto.
                    </p>
                    {status === 'trial' && (
                        <div className="inline-block px-4 py-2 mt-4 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-bold border border-emerald-200 animate-pulse">
                            Tua Attuale: Versione Start (Prova Gratuita)
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative bg-card rounded-3xl p-8 border-2 flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-xl",
                                plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border/50 hover:border-border",
                                currentPlan === plan.id && "ring-4 ring-primary/20",
                                selectedPlan === plan.id && "ring-2 ring-primary"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                                    Consigliato
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className={cn("text-xl font-bold", plan.popular ? "text-primary" : "text-foreground")}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-4xl font-black tracking-tight">€{plan.price}</span>
                                    <span className="text-muted-foreground font-medium">{plan.period}</span>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> {plan.agents}
                                </p>
                            </div>

                            <hr className="border-border/50 mb-6" />

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <div className={cn("p-1 rounded-full mt-0.5", plan.popular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-foreground/80 font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {currentPlan === plan.id ? (
                                <button disabled className="w-full py-4 rounded-xl font-bold bg-muted text-muted-foreground cursor-not-allowed">
                                    Piano Attivo
                                </button>
                            ) : selectedPlan === plan.id ? (
                                <div className="animate-in fade-in zoom-in">
                                    <p className="text-xs text-center text-muted-foreground mb-2">Paga con PayPal per attivare</p>
                                    <PayPalButtons
                                        style={{ shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' }}
                                        createSubscription={(data, actions) => {
                                            return actions.subscription.create({
                                                plan_id: PAYPAL_PLAN_IDS[plan.id as keyof typeof PAYPAL_PLAN_IDS]
                                            });
                                        }}
                                        onApprove={handleApprove}
                                    />
                                    <button
                                        onClick={() => setSelectedPlan(null)}
                                        className="w-full mt-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground underline"
                                    >
                                        Annulla
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold transition-all",
                                        plan.popular
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                                            : "bg-muted text-foreground hover:bg-muted/80"
                                    )}
                                >
                                    Scegli {plan.name}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-muted/20 border border-border/50 rounded-2xl p-8 mt-12 text-center">
                    <h3 className="text-lg font-bold mb-2">Hai bisogno di più di 10 agenti?</h3>
                    <p className="text-muted-foreground mb-4">Contattaci per una soluzione Enterprise personalizzata.</p>
                    <a href="mailto:support@no.ia" className="text-primary font-bold hover:underline">Contatta il Supporto</a>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}

