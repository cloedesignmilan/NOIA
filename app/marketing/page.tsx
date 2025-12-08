"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sparkles, FileText, Share2, Megaphone, ArrowRight, Zap, Trash } from 'lucide-react';

const tools = [
    {
        title: "Generatore Annunci",
        description: "Crea descrizioni immobiliari persuasive per Idealista e Casa.it in un click.",
        icon: FileText,
        href: "/marketing/listings",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "hover:border-blue-500/50"
    },
    {
        title: "Blog & SEO",
        description: "Scrivi articoli autorevoli e guide immobiliari ottimizzate per Google.",
        icon: Sparkles,
        href: "/marketing/blog",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "hover:border-purple-500/50"
    },
    {
        title: "Social Ads",
        description: "Genera copy magnetici per le tue campagne Meta (Facebook & Instagram).",
        icon: Share2,
        href: "/marketing/social",
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        border: "hover:border-pink-500/50"
    }
];

export default function MarketingDashboard() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_key');
        if (stored) setApiKey(stored);
    }, []);

    const saveKey = (val: string) => {
        setApiKey(val);
        localStorage.setItem('gemini_api_key', val);
    };

    const clearKey = () => {
        setApiKey('');
        localStorage.removeItem('gemini_api_key');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Settings */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                            Marketing AI Suite
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                            <Zap className="w-3 h-3 mr-1 fill-current" /> Beta
                        </span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1 max-w-2xl">
                        Potenzia la tua agenzia con l'Intelligenza Artificiale. Genera contenuti di qualità in secondi.
                    </p>
                </div>

                {/* API Key Input */}
                <div className="w-full md:w-auto min-w-[300px] glass p-4 rounded-xl border border-border/50 shadow-sm">
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block flex items-center justify-between">
                        Gemini API Key
                        <div className="flex gap-2">
                            {apiKey && (
                                <button onClick={clearKey} className="text-xs text-destructive hover:underline flex items-center gap-1">
                                    <Trash className="w-3 h-3" /> Elimina
                                </button>
                            )}
                            <button onClick={() => setShowKey(!showKey)} className="text-xs text-primary hover:underline">
                                {showKey ? "Nascondi" : "Mostra"}
                            </button>
                        </div>
                    </label>
                    <input
                        type={showKey ? "text" : "password"}
                        className="input-premium w-full text-sm h-9"
                        placeholder="Incolla qui la tua chiave..."
                        value={apiKey}
                        onChange={(e) => saveKey(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                        La chiave verrà salvata nel browser per le prossime sessioni.
                    </p>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.title}
                        href={tool.href}
                        className={`group relative p-8 glass-card border-l-4 border-l-transparent ${tool.border} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${tool.bg} ${tool.color}`}>
                            <tool.icon className="w-7 h-7" />
                        </div>

                        <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                            {tool.title}
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                        </h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            {tool.description}
                        </p>
                    </Link>
                ))}
            </div>

            {/* Info Section */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* How it works */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-4">Come funziona?</h3>
                        <ul className="space-y-4 font-medium text-white/80">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
                                <div>
                                    <span className="text-white font-bold">Inserisci la tua Chiave API.</span>
                                    <p className="text-sm mt-1 opacity-80">Necessaria per collegarsi all'intelligenza di Google Gemini.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
                                <div>
                                    <span className="text-white font-bold">Scegli lo strumento.</span>
                                    <p className="text-sm mt-1 opacity-80">Annunci immobiliari, Articoli Blog o Social Media Ads.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
                                <div>
                                    <span className="text-white font-bold">Genera e Copia.</span>
                                    <p className="text-sm mt-1 opacity-80">L'IA creerà contenuti professionali in pochi secondi, pronti all'uso.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    {/* Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                </div>

                {/* API Instructions */}
                <div className="p-8 rounded-3xl glass-card border-none bg-secondary/50 relative overflow-hidden">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        Come ottenere la Chiave API?
                    </h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            Per usare questi strumenti hai bisogno di una chiave gratuita di Google.
                            Ecco come ottenerla in 2 minuti:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 font-medium text-foreground">
                            <li>
                                Vai su <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Google AI Studio</a>.
                            </li>
                            <li>
                                Clicca su <strong>"Create API key"</strong>.
                            </li>
                            <li>
                                Copia la chiave "secret" che inizia con <code>AIza...</code>
                            </li>
                            <li>
                                Incollala nel box qui sopra in alto a destra.
                            </li>
                        </ol>
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs mt-4">
                            <strong>Nota Importante:</strong> Se ricevi un errore "Service Disabled", devi abilitare l'API nel tuo account Google Cloud cliccando sul link che apparirà nel messaggio di errore.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
