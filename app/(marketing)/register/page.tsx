"use client";

import Link from 'next/link';

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl p-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4 shadow-lg shadow-primary/20">
                        <span className="text-primary-foreground font-bold text-lg">NO</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Iscrizioni Chiuse</h1>
                    <p className="text-muted-foreground mt-4">
                        Le iscrizioni sono momentaneamente sospese per manutenzione programmata.
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Stiamo lavorando per migliorare la piattaforma. Riprova più tardi.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center py-3.5 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/90 transition-all border border-border"
                    >
                        Torna alla Home
                    </Link>
                </div>
            </div>
        </div >
    );
}
