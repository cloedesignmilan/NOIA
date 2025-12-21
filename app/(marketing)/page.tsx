import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Zap, Sparkles, PenTool, Share2, Layout, ScanLine, XCircle, Database, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 border-b border-border/40 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">NO</span>
            </div>
            <span className="text-xl font-bold tracking-tight">NO.IA</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Accedi
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
              Inizia Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - High Conversion */}
        <section className="relative py-20 sm:py-32 px-4 text-center space-y-8 max-w-5xl mx-auto overflow-hidden">
          {/* Background Decor Elements */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 border border-primary/20">
            <Sparkles className="w-3 h-3" />
            Creato da Agenti, Per Agenti
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-8 duration-700 leading-[1.1]">
            Il Primo Software di Gestione finanziaria per la tua Agenzia Immobiliare <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-600 to-pink-600">Creato da Agenti Immobiliari.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 leading-relaxed">
            Smetti di perdere tempo con fogli Excel.
            NO.IA unisce <span className="text-foreground font-bold">Gestione Finanziaria</span>, <span className="text-foreground font-bold">Analisi Team</span> e <span className="text-foreground font-bold">Controllo Costi</span> in un'unica suite potente e intuitiva.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 fill-current" /> Prova Gratuitamente
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 text-lg font-medium bg-card border border-border rounded-2xl hover:bg-muted transition-colors flex items-center justify-center gap-2">
              Scopri di Più <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="pt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Nessuna Carta Richiesta</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Setup in 30 secondi</div>
          </div>
          {/* Hero Image */}
          <div className="mt-16 relative w-full max-w-6xl mx-auto animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-20 bottom-0 w-full" />
            <div className="rounded-3xl border border-border/50 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm ring-1 ring-white/10">
              <Image
                src="/showcase/dashboard-hero.png"
                alt="NO.IA Dashboard"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Feature Grid: Finance & Management */}
        <section id="features" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Finanza & Controllo <br />Sotto Controllo.</h2>
                <p className="text-lg text-muted-foreground">
                  Non basta vendere, bisogna gestire. NO.IA ti offre una dashboard finanziaria completa per tracciare ogni singolo euro della tua agenzia.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Pianificazione Entrate</h4>
                      <p className="text-muted-foreground text-sm">Traccia provvigioni, preliminari e rogiti futuri.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">KPI Finanziari</h4>
                      <p className="text-muted-foreground text-sm">Analisi costi/ricavi in tempo reale.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 blur-3xl opacity-20 transform rotate-6 group-hover:opacity-30 transition-opacity duration-700"></div>
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-black/50 backdrop-blur-sm">
                  <Image
                    src="/showcase/expenses-analytics.png"
                    alt="Dashboard Finanziaria"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute -bottom-10 -right-10 w-2/3 shadow-2xl border border-white/10 rounded-xl overflow-hidden hidden lg:block transform group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500">
                    <Image
                      src="/showcase/transactions-table.png"
                      alt="Tabella Transazioni"
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: Team Management */}
        <section className="py-24 bg-gradient-to-t from-background to-muted/20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-l from-orange-400 to-yellow-600 blur-3xl opacity-20 transform -rotate-6 group-hover:opacity-30 transition-opacity duration-700"></div>
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-black/50 backdrop-blur-sm">
                  <Image
                    src="/showcase/agent-list.png"
                    alt="Lista Agenti"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute -top-10 -left-10 w-2/3 shadow-2xl border border-white/10 rounded-xl overflow-hidden hidden lg:block transform group-hover:translate-y-2 group-hover:translate-x-2 transition-transform duration-500">
                    <Image
                      src="/showcase/agent-performance.png"
                      alt="Performance Agenti"
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Il Tuo Team al <br />Top della Forma.</h2>
                <p className="text-lg text-muted-foreground">
                  Gestisci collaboratori, dipendenti e soci con trasparenza totale. Calcola automaticamente split, provvigioni e monitora chi performa meglio.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Classifiche Live</h4>
                      <p className="text-muted-foreground text-sm">Leaderboard in tempo reale basata su fatturato e vendite.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Calcolo Provvigionale</h4>
                      <p className="text-muted-foreground text-sm">Automazione completa da entrate a compensi netti.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Feature Grid: Smart Scan AI (NEW) */}
        <section className="py-24 bg-gradient-to-b from-background to-emerald-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  Novità AI
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Smart Scan AI: <br />Addio Inserimento Manuale.</h2>
                <p className="text-lg text-muted-foreground">
                  Fai una foto allo scontrino e l'Intelligenza Artificiale farà il resto.
                  NO.IA legge automaticamente data, importo e fornitore in meno di 2 secondi.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Zero Errori</h4>
                      <p className="text-muted-foreground text-sm">L'IA non sbaglia a trascrivere le cifre, tu sì (soprattutto dopo 8 ore di lavoro).</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Categorizzazione Automatica</h4>
                      <p className="text-muted-foreground text-sm">Il sistema riconosce se è benzina, pranzo o marketing e lo archivia correttamente.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 blur-3xl opacity-20 transform -rotate-3 group-hover:opacity-30 transition-opacity duration-700"></div>
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-black/50 backdrop-blur-sm p-2">
                  {/* Placeholder for receipt scan demo - using a generic finance image for now if specific one implies creating it, or reuse existing style */}
                  <div className="bg-zinc-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <ScanLine className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-emerald-200">Analisi Scontrino in corso...</p>
                      <div className="w-48 h-12 bg-white/5 rounded-lg mx-auto flex items-center px-4 gap-3 border border-white/10">
                        <div className="w-8 h-8 rounded bg-white/10"></div>
                        <div className="h-2 w-20 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: Security & Backup */}
        <section className="py-24 border-t border-border/50 bg-gradient-to-b from-background to-blue-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-400 blur-3xl opacity-20 transform rotate-3 group-hover:opacity-30 transition-opacity duration-700"></div>
                <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-black/50 backdrop-blur-sm p-8 flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-6 w-full max-w-sm relative z-10">
                    <div className="w-24 h-24 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                      <Database className="w-12 h-12 text-blue-400" />
                    </div>
                    <div className="space-y-3 bg-zinc-900/80 p-6 rounded-xl border border-white/5 backdrop-blur-md">
                      <div className="flex justify-between text-xs text-blue-300 font-mono mb-2">
                        <span>backup_agenzia.json</span>
                        <span>100%</span>
                      </div>
                      <div className="h-2 bg-blue-950 rounded-full w-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2">Ultimo salvataggio: Ora</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3 h-3" />
                  Sicurezza Totale
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">I Dati sono Tuoi.<br />Non nostri.</h2>
                <p className="text-lg text-muted-foreground">
                  Crediamo nella sovranità dei dati. Scarica un backup completo della tua agenzia quando vuoi e ripristinalo in un click.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Download Istantaneo</h4>
                      <p className="text-muted-foreground text-sm">Esporta tutto in formato JSON. Clienti, transazioni, note: tutto.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Ripristino "Time Machine"</h4>
                      <p className="text-muted-foreground text-sm">Hai sbagliato qualcosa? Ricarica un backup precedente e riparti da zero.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section: NO.IA vs Excel */}
        <section className="py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">
                Due modi di gestire la tua agenzia.<br />
                <span className="text-muted-foreground text-2xl sm:text-4xl">Uno ti fa crescere. L’altro ti fa perdere tempo.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Excel Card */}
              <div className="rounded-3xl p-8 bg-zinc-900/50 border border-red-900/20 relative overflow-hidden group hover:border-red-900/40 transition-colors">
                <div className="absolute top-0 right-0 p-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="8" x2="16" y1="13" y2="13" /><line x1="8" x2="16" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-300">Excel / Fogli di Calcolo</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Inserimento manuale (e errori inevitabili)",
                    "File sparsi: “versione finale”, “finalissima”...",
                    "Nessun flusso: entrate, spese, split… tutto a mano",
                    "Report lenti: devi “lavorare sui numeri” per capire",
                    "Difficile lavorare in team (condivisioni, caos)",
                    "Dati vecchi: aggiornati solo se qualcuno ha voglia"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-400">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* NO.IA Card */}
              <div className="rounded-3xl p-8 bg-zinc-900 border border-primary/20 relative overflow-hidden ring-1 ring-primary/20 shadow-2xl shadow-primary/10">
                <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                    <span className="font-bold text-lg">NO</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">NO.IA Finance</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Inserimento guidato + Smart Scan AI (zero errori)",
                    "Tutto in un’unica dashboard: entrate, margini, scadenze",
                    "Calcolo automatico split e provvigioni",
                    "KPI e report pronti: sai subito come stai andando",
                    "Collaborazione semplice: ognuno vede i suoi dati",
                    "Numeri live: decisioni rapide, meno stress"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-100 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Section (New) */}
        <section className="py-24 relative overflow-hidden">
          {/* Background Radial Gradient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Portalo sempre con te.</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                La tua agenzia non si ferma mai, nemmeno NO.IA.
                Accedi a statistiche, entrate e spese direttamente dal tuo iPhone, ovunque tu sia.
              </p>
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">

              {/* iPhone Portrait Mockup */}
              <div className="relative z-20 transform md:translate-y-12 hover:-translate-y-4 transition-transform duration-500">
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                  <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                  <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                  <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800">
                    <Image
                      src="/mobile-portrait.png"
                      alt="NO.IA su iPhone"
                      width={272}
                      height={572}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* iPhone Landscape Mockup */}
              <div className="relative z-10 hidden md:block transform hover:scale-105 transition-transform duration-500">
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[12px] rounded-[2.5rem] h-[300px] w-[600px] shadow-xl">
                  <div className="h-[3px] w-[32px] bg-gray-800 absolute left-1/2 -translate-x-1/2 -top-[15px] rounded-b-lg"></div>
                  <div className="rounded-[2rem] overflow-hidden w-[576px] h-[276px] bg-white dark:bg-gray-800">
                    <Image
                      src="/mobile-landscape.png"
                      alt="NO.IA Landscape Dashboard"
                      width={576}
                      height={276}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Scegli la tua crescita.</h2>
              <p className="text-lg text-muted-foreground">Piani flessibili per ogni fase della tua agenzia.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Pro */}
              <div className="p-8 rounded-3xl border border-border bg-card/50 flex flex-col hover:border-border/80 transition-all">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-black mb-2">€39<span className="text-sm font-medium text-muted-foreground">/mese</span></div>
                <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground border-b border-border/50 pb-4">
                  <ShieldCheck className="w-4 h-4" /> Fino a 2 Agenti
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Entrate & Uscite Illimitate</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Dashboard Avanzata</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Gestione Commissioni</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Supporto Prioritario</div>
                </div>
                <Link href="/register?plan=pro" className="mt-8 w-full py-3 rounded-xl border border-border font-bold hover:bg-muted transition-colors text-center">Scegli Pro</Link>
              </div>

              {/* Max */}
              <div className="p-8 rounded-3xl border-2 border-primary bg-card/80 relative flex flex-col shadow-2xl shadow-primary/20 scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">Consigliato</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary">Max</h3>
                <div className="text-4xl font-black mb-2">€59<span className="text-sm font-medium text-muted-foreground">/mese</span></div>
                <div className="flex items-center gap-2 mb-6 text-sm text-primary/80 border-b border-primary/20 pb-4">
                  <ShieldCheck className="w-4 h-4" /> Da 3 a 5 Agenti
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="w-4 h-4 text-primary" /> Tutto incluso in Pro</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Reportistica PDF</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Ruoli Personalizzati</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-primary" /> Training AI Dedicato</div>
                </div>
                <Link href="/register?plan=max" className="mt-8 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors text-center shadow-lg shadow-primary/25">Scegli Max</Link>
              </div>

              {/* Elite */}
              <div className="p-8 rounded-3xl border border-border bg-card/50 flex flex-col hover:border-purple-500/50 transition-all group">
                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-500 transition-colors">Elite</h3>
                <div className="text-4xl font-black mb-2">€99<span className="text-sm font-medium text-muted-foreground">/mese</span></div>
                <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground border-b border-border/50 pb-4">
                  <ShieldCheck className="w-4 h-4" /> Da 6 a 9 Agenti
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Tutto incluso in Max</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-purple-500" /> <span className="font-bold text-foreground">Multi-Agenzia & Dashboard Globale</span></div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> API Access</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Account Manager Dedicato</div>
                  <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="w-4 h-4 text-zinc-500" /> Setup Assistito</div>
                </div>
                <Link href="/register?plan=elite" className="mt-8 w-full py-3 rounded-xl border border-border font-bold hover:bg-muted transition-colors text-center">Scegli Elite</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-20 px-4 text-center bg-muted/20">
          <div className="card-premium max-w-5xl mx-auto p-12 bg-gradient-to-br from-primary via-indigo-600 to-purple-700 text-white border-none shadow-2xl relative overflow-hidden">
            {/* Texture overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black mb-6">Il futuro del Real Estate è qui.</h2>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto font-medium">
                Unisciti alla rivoluzione. Risparmia 20 ore a settimana e chiudi più contratti con l'aiuto dell'Intelligenza Artificiale.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="px-10 py-5 text-xl font-bold bg-white text-primary rounded-2xl shadow-xl hover:bg-white/95 hover:scale-105 transition-all text-primary">
                  Inizia la Prova Gratuita
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/70 font-medium">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> 14 Giorni Gratis</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Disdici quando vuoi</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-card border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">NO</span>
            </div>
            <span className="text-xl font-bold tracking-tight">NO.IA</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 NO.IA Finance. <br />
            Made with ❤️ by Real Estate Agents for Real Estate Agents.
          </p>
        </div>
      </footer>
    </div>
  );
}
