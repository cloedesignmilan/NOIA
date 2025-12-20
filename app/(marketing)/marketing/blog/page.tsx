"use client";

import { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function BlogGeneratorPage() {
    const [activeTab, setActiveTab] = useState<'custom' | 'news'>('custom');
    const [loading, setLoading] = useState(false);
    const [newsLoading, setNewsLoading] = useState(false);
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    // Image Gen State
    const [imagePrompt, setImagePrompt] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageLoading, setImageLoading] = useState(false);

    // News Feed State
    const [newsItems, setNewsItems] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        topic: '',
        target: 'acquirenti',
        keywords: '',
        source: '' // Used for extra info or news summary in rewrite mode
    });

    // Fetch trending news
    const fetchNews = async () => {
        setNewsLoading(true);
        try {
            const storedKey = localStorage.getItem('gemini_api_key');
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptType: 'news-discovery',
                    data: {},
                    apiKey: storedKey
                })
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);

            // Parse JSON result (handle potential markdown added by AI)
            let cleanJson = json.result.replace(/```json/g, '').replace(/```/g, '').trim();
            setNewsItems(JSON.parse(cleanJson));
        } catch (err) {
            console.error(err);
            alert("Errore nel recupero notizie.");
        } finally {
            setNewsLoading(false);
        }
    };

    // Handle Rewrite Action
    const handleRewrite = (item: any) => {
        setFormData({
            ...formData,
            topic: `Riscrivi: ${item.title}`,
            source: `Fonte originale: ${item.source}.\nRiassunto: ${item.summary}`,
            keywords: 'mercato immobiliare, news, aggiornamenti'
        });
        setActiveTab('custom'); // Switch back to generator
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setResult("");

        try {
            const storedKey = localStorage.getItem('gemini_api_key');

            // Determine based on content if it's a rewrite or standard blog
            const isRewrite = formData.topic.startsWith("Riscrivi:");
            const promptType = isRewrite ? 'rewrite' : 'blog';

            // If rewrite, pass title/summary in specific fields if needed, 
            // but our API 'rewrite' prompt expects 'data.title' and 'data.summary'.
            // For simplicity in UI, we mapped them to 'topic' and 'source', so we adapt data here.
            const apiData = isRewrite ? {
                title: formData.topic.replace("Riscrivi: ", ""),
                summary: formData.source
            } : formData;

            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptType: promptType,
                    data: apiData,
                    apiKey: storedKey
                })
            });

            const json = await res.json();
            if (json.error) {
                alert(json.error);
            } else {
                setResult(json.result);
            }
        } catch (err) {
            console.error(err);
            alert("Errore connessione.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!formData.topic) {
            alert("Inserisci un argomento prima di generare l'immagine.");
            return;
        }
        setImageLoading(true);
        setImageUrl("");

        try {
            const storedKey = localStorage.getItem('gemini_api_key');

            // 1. Get Prompt from Gemini
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptType: 'image-prompt',
                    data: { topic: formData.topic.replace(/^Riscrivi:\s*/i, '') },
                    apiKey: storedKey
                })
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);

            const imagePrompt = json.result.trim();
            console.log("Image Prompt:", imagePrompt);

            // 2. Use Pollinations.ai for image - FORCE HIGH RES 16:9
            // We use a random seed to ensure freshness
            const seed = Math.floor(Math.random() * 1000);
            const finalUrl = `https://pollinations.ai/p/${encodeURIComponent(imagePrompt)}?width=1920&height=1080&seed=${seed}&model=flux&nologo=true`;

            // Pre-load image to ensure it's ready before showing
            const img = new Image();
            img.src = finalUrl;
            img.onload = () => {
                setImageUrl(finalUrl);
                setImageLoading(false);
            };

        } catch (err) {
            console.error(err);
            alert("Errore generazione immagine.");
            setImageLoading(false);
        }
    };

    const downloadImage = async () => {
        if (!imageUrl) return;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cover-blog-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed", err);
            window.open(imageUrl, '_blank');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/marketing" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Torna alla Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
                            <BookOpen className="w-6 h-6" />
                        </span>
                        Blog & News Writer
                    </h1>
                </div>

                {/* Tabs */}
                <div className="bg-muted/50 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setActiveTab('custom')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'custom' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Generatore Articoli
                    </button>
                    <button
                        onClick={() => { setActiveTab('news'); if (newsItems.length === 0) fetchNews(); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'news' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        News Feed (Trending)
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'custom' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Input Form */}
                    <div className="glass-card p-6 h-fit">
                        <div className="mb-6 pb-4 border-b border-border/50">
                            <h2 className="text-lg font-bold">Personalizza Articolo</h2>
                            <p className="text-sm text-muted-foreground">Compila i campi per generare un nuovo post.</p>
                        </div>
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Argomento Principale</label>
                                <input
                                    className="input-premium w-full"
                                    placeholder="Es. Vendere casa da privato vs Agenzia"
                                    value={formData.topic}
                                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Target Audience</label>
                                    <select
                                        className="input-premium w-full"
                                        value={formData.target}
                                        onChange={e => setFormData({ ...formData, target: e.target.value })}
                                    >
                                        <option value="acquirenti">Chi cerca casa</option>
                                        <option value="venditori">Chi vuole vendere</option>
                                        <option value="investitori">Investitori</option>
                                        <option value="locazioni">Affittuari / Proprietari</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Keywords SEO</label>
                                    <input
                                        className="input-premium w-full"
                                        placeholder="Es. valutazione, rogito, provvigioni"
                                        value={formData.keywords}
                                        onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Fonti o Note Extra</label>
                                <textarea
                                    className="w-full p-4 rounded-2xl bg-secondary border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 min-h-[100px] font-medium placeholder:text-muted-foreground/70 transition-all resize-none"
                                    placeholder="Incolla qui dati di mercato, link a normative, o il testo da riscrivere..."
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? "Scrittura in corso..." : "Genera Articolo"}
                            </button>
                        </form>
                    </div>

                    {/* Result View */}
                    <div className="glass-card p-6 min-h-[500px] flex flex-col relative overflow-hidden bg-gradient-to-br from-card to-purple-50/50 dark:to-purple-900/10">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-500" /> Anteprima
                            </h3>
                            {result && (
                                <button
                                    onClick={copyToClipboard}
                                    className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copiato!" : "Copia Testo"}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap leading-relaxed text-sm font-mono bg-muted/30 p-4 rounded-xl">
                            {result ? (
                                result
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                                    <Sparkles className="w-12 h-12 mb-4 text-purple-300" />
                                    <p className="text-center font-medium">Definisci l'argomento e l'IA scriverà per te.</p>
                                </div>
                            )}
                        </div>

                        {/* Image Generation Section */}
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <span className="p-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600"><Sparkles className="w-3 h-3" /></span>
                                    Copertina Articolo
                                </h3>
                            </div>

                            {!imageUrl && !imageLoading && (
                                <button
                                    onClick={handleGenerateImage}
                                    className="w-full py-3 border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:border-purple-500/50 transition-all group"
                                >
                                    <Sparkles className="w-5 h-5 mb-1 group-hover:text-purple-500 transition-colors" />
                                    <span className="text-xs font-bold">Genera Copertina AI</span>
                                </button>
                            )}

                            {imageLoading && (
                                <div className="w-full h-40 bg-muted/30 rounded-xl flex items-center justify-center animate-pulse">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                </div>
                            )}

                            {imageUrl && (
                                <div className="relative group rounded-xl overflow-hidden border border-border/50 shadow-sm">
                                    <img src={imageUrl} alt="Generated Cover" className="w-full h-auto object-cover max-h-[200px]" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={downloadImage}
                                            className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-100"
                                        >
                                            <Copy className="w-3 h-3" /> Scarica
                                        </button>
                                        <button
                                            onClick={handleGenerateImage}
                                            className="p-1.5 bg-white/20 text-white rounded-lg hover:bg-white/40 backdrop-blur-sm"
                                            title="Rigenera"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Notizie Trending (Italia)</h2>
                        <button onClick={fetchNews} className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Aggiorna Notizie
                        </button>
                    </div>

                    {newsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {newsItems.map((item, idx) => (
                                <div key={idx} className="glass-card p-6 flex flex-col hover:border-purple-500/50 transition-all hover:-translate-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        {item.source}
                                    </span>
                                    <h3 className="font-bold text-lg mb-2 leading-tight">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-3">{item.summary}</p>

                                    <button
                                        onClick={() => handleRewrite(item)}
                                        className="w-full py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-3 h-3 text-purple-600" /> Genera Articolo
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
