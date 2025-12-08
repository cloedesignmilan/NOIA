"use client";

import { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, Loader2, Share2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SocialGeneratorPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        goal: 'Generazione Contatti',
        subject: '',
        details: '',
        hook: 'Problema -> Soluzione'
    });

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult([]);

        try {
            const storedKey = localStorage.getItem('gemini_api_key');

            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptType: 'social',
                    data: formData,
                    apiKey: storedKey
                })
            });

            const json = await res.json();
            if (json.error) {
                alert(json.error);
            } else {
                // Clean potential markdown wrapping
                let cleanJson = json.result.replace(/```json/g, '').replace(/```/g, '').trim();
                try {
                    setResult(JSON.parse(cleanJson));
                } catch (e) {
                    console.error("Failed to parse JSON", e);
                    alert("Errore nel formato della risposta AI.");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Errore connessione.");
        } finally {
            setLoading(false);
        }
    };

    const copyVariant = (variant: any, idx: number) => {
        // CLEAN COPY: Only text, no labels
        const cleanText = `${variant.hook}\n\n${variant.body}\n\n${variant.cta}`;
        navigator.clipboard.writeText(cleanText);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <Link href="/marketing" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Torna alla Dashboard
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                    <span className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl text-pink-600">
                        <Share2 className="w-6 h-6" />
                    </span>
                    Social Ads Generator
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Crea copy persuasivi per le tue campagne Facebook & Instagram Ads.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="glass-card p-6 h-fit">
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Obiettivo Campagna</label>
                            <select
                                className="input-premium w-full"
                                value={formData.goal}
                                onChange={e => setFormData({ ...formData, goal: e.target.value })}
                            >
                                <option>Generazione Contatti (Lead Gen)</option>
                                <option>Traffico al Sito</option>
                                <option>Interazione / Commenti</option>
                                <option>Brand Awareness</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Oggetto della Sponsorizzata</label>
                            <input
                                className="input-premium w-full"
                                placeholder="Es. Valutazione Gratuita Immobili"
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Dettagli Offerta / Punti Chiave</label>
                            <textarea
                                className="w-full p-4 rounded-2xl bg-secondary border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 min-h-[100px] font-medium placeholder:text-muted-foreground/70 transition-all resize-none"
                                placeholder="Es. Report PDF gratuito, valutazione in 24h, agenti esperti di zona..."
                                value={formData.details}
                                onChange={e => setFormData({ ...formData, details: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Angolo / Hook Principale</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Problema -> Soluzione', 'Urgenza / Scarsità', 'Autorità / Prova Sociale', 'Curiosità'].map(hook => (
                                    <button
                                        key={hook}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, hook })}
                                        className={cn(
                                            "py-2 px-3 rounded-xl text-xs font-bold border transition-all",
                                            formData.hook === hook ? 'bg-pink-500/10 border-pink-500 text-pink-600' : 'border-border hover:bg-muted'
                                        )}
                                    >
                                        {hook}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full btn-primary bg-pink-600 hover:bg-pink-700 shadow-pink-500/20 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? "Generazione..." : "Crea 3 Varianti Ads"}
                        </button>
                    </form>
                </div>

                {/* Result View */}
                <div className="glass-card p-6 min-h-[500px] flex flex-col relative overflow-hidden bg-gradient-to-br from-card to-pink-50/50 dark:to-pink-900/10">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-pink-500" /> Varianti Copy
                        </h3>
                        {result.length > 0 && (
                            <span className="text-xs text-muted-foreground">3 Varianti generate</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        {result.length > 0 ? (
                            result.map((variant, idx) => (
                                <div key={idx} className="bg-background/50 border border-border/50 rounded-xl p-5 hover:border-pink-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-3 border-b border-border/30 pb-2">
                                        <h4 className="font-bold text-sm text-pink-600 uppercase tracking-wider">{variant.type}</h4>
                                        <button
                                            onClick={() => copyVariant(variant, idx)}
                                            className="text-xs font-bold flex items-center gap-1.5 px-2 py-1 bg-background border border-border rounded hover:bg-muted transition-colors"
                                        >
                                            {copiedIndex === idx ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                            {copiedIndex === idx ? "Copiato!" : "Copia (Pulito)"}
                                        </button>
                                    </div>

                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">🔥 Hook</span>
                                            <p className="leading-relaxed">{variant.hook}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">📄 Corpo</span>
                                            <p className="leading-relaxed whitespace-pre-wrap">{variant.body}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">🚀 CTA</span>
                                            <p className="leading-relaxed font-medium">{variant.cta}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                                <Sparkles className="w-12 h-12 mb-4 text-pink-300" />
                                <p className="text-center font-medium">L'IA genererà 3 varianti (A/B/C) per i test.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
