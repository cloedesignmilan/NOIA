'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console
        console.error("Dashboard Error Boundary Caught:", error);
    }, [error]);

    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 p-4">
            <div className="max-w-md w-full rounded-2xl bg-card border border-border shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-3">Qualcosa è andato storto</h2>
                <p className="text-muted-foreground mb-6">
                    Si è verificato un errore durante il caricamento della dashboard.
                </p>

                {/* Technical Error Details - Visible for debugging */}
                <div className="bg-muted/50 rounded-lg p-4 mb-8 text-left border border-border/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Dettaglio Errore:</p>
                    <code className="text-xs text-destructive font-mono break-all block">
                        {error.message || "Errore sconosciuto"}
                    </code>
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
                    >
                        Torna al Login
                    </button>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" /> Riprova
                    </button>
                </div>
            </div>
        </div>
    );
}
