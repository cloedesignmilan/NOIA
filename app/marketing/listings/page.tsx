"use client";

import { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, Loader2, Home, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ListingGeneratorPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        type: 'Appartamento',
        zone: '',
        sqm: '',
        rooms: '',
        features: '',
        tone: 'Emozionale e Professionale'
    });

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult("");
        setError("");

        try {
            const storedKey = localStorage.getItem('gemini_api_key');

            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptType: 'listing',
                    data: formData,
                    apiKey: storedKey
                })
            });

            const json = await res.json();
            if (json.error) {
                setError(json.error);
            } else {
                setResult(json.result);
            }
        } catch (err) {
            console.error(err);
            setError("Errore di connessione al server.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <Link href="/marketing" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Torna alla Dashboard
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                    <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                        <Home className="w-6 h-6" />
                    </span>
                    Generatore Annunci Immobiliari
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Crea descrizioni perfette per Idealista e Casa.it in pochi secondi.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="glass-card p-6 h-fit">
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Tipologia</label>
                                <select
                                    className="input-premium w-full"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option>Appartamento</option>
                                    <option>Villa</option>
                                    <option>Attico</option>
                                    <option>Rustico</option>
                                    <option>Ufficio</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Zona / Città</label>
                                <input
                                    className="input-premium w-full"
                                    placeholder="Es. Centro Storico, Milano"
                                    value={formData.zone}
                                    onChange={e => setFormData({ ...formData, zone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Metri Quadri</label>
                                <input
                                    className="input-premium w-full"
                                    type="number"
                                    placeholder="Es. 120"
                                    value={formData.sqm}
                                    onChange={e => setFormData({ ...formData, sqm: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Locali</label>
                                <input
                                    className="input-premium w-full"
                                    placeholder="Es. 3 (2 camere, 1 studio)"
                                    value={formData.rooms}
                                    onChange={e => setFormData({ ...formData, rooms: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Punti di Forza / Caratteristiche</label>
                            <textarea
                                className="w-full p-4 rounded-2xl bg-secondary border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 min-h-[100px] font-medium placeholder:text-muted-foreground/70 transition-all resize-none"
                                placeholder="Es. Ristrutturato, vista mare, parquet, domotica, classe A4..."
                                value={formData.features}
                                onChange={e => setFormData({ ...formData, features: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Tono di Voce</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Emozionale', 'Tecnico', 'Lussuoso'].map(tone => (
                                    <button
                                        key={tone}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tone })}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border ${formData.tone === tone ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-muted'}`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? "Generazione in corso..." : "Genera Annuncio con IA"}
                        </button>
                    </form>
                </div>

                {/* Error Display */}
                <div className="flex flex-col gap-4">
                    {error && (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">!</div>
                            {error}
                        </div>
                    )}

                    {/* Result View */}
                    <div className="glass-card p-6 min-h-[500px] flex flex-col relative overflow-hidden bg-gradient-to-br from-card to-blue-50/50 dark:to-blue-900/10">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" /> Risultato
                            </h3>
                            {result && (
                                <button
                                    onClick={copyToClipboard}
                                    className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copiato!" : "Copia testo"}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap leading-relaxed text-sm">
                            {result ? (
                                result
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                                    <Sparkles className="w-12 h-12 mb-4 text-blue-300" />
                                    <p className="text-center font-medium">Compila il form e lascia fare alla magia.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
