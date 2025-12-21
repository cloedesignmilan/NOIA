"use client";

import { useState } from "react";
import { Download, Database, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function BackupManager() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/backup/export');

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Export failed");
            }

            // Create Blob and Trigger Download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Extract filename from header or default
            const disposition = response.headers.get('Content-Disposition');
            let filename = `noia_backup_${new Date().toISOString().split('T')[0]}.json`;
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename="([^"]*)"/.exec(disposition);
                if (matches != null && matches[1]) filename = matches[1];
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

        } catch (error) {
            console.error("Download failed:", error);
            alert("Errore durante il download del backup. Riprova.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">Backup Dati</CardTitle>
                        <p className="text-sm text-muted-foreground">Esporta tutti i dati della tua agenzia in formato JSON.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-sm">Cosa include il backup?</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
                            <li>Anagrafica Agenzia e Impostazioni</li>
                            <li>Tutti gli Agenti e i loro profili</li>
                            <li>Storico completo Transazioni (Entrate/Uscite)</li>
                            <li>Lista Incarichi e Pipeline</li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {isExporting ? 'Generazione...' : 'Scarica Backup Completo'}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
