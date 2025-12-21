"use client";

import { useState } from "react";
import { Download, Database, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function BackupManager() {
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [restoreMessage, setRestoreMessage] = useState('');

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

            // Update last backup time locally (optimistic)
            setLastBackup(new Date().toISOString());

        } catch (error) {
            console.error("Download failed:", error);
            alert("Errore durante il download del backup. Riprova.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleRestoreWrapper = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("ATTENZIONE: Il ripristino sovrascriverà TUTTI i dati attuali con quelli del backup. Questa operazione è irreversibile. Sei sicuro di voler procedere?")) {
            e.target.value = ''; // Reset input
            return;
        }

        setIsRestoring(true);
        setRestoreMessage('');
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const jsonContent = event.target?.result as string;
                // Parse to verify JSON before sending
                const parsed = JSON.parse(jsonContent);

                const response = await fetch('/api/backup/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsed)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Restore failed");
                }

                setRestoreMessage("✅ Ripristino completato con successo! Ricarica la pagina.");
                setTimeout(() => window.location.reload(), 2000);

            } catch (error: any) {
                console.error("Restore failed:", error);
                alert(`Errore Ripristino: ${error.message}`);
                setRestoreMessage("❌ Errore durante il ripristino.");
            } finally {
                setIsRestoring(false);
                if (e.target) e.target.value = '';
            }
        };

        reader.readAsText(file);
    };

    // Check backup age
    const showWarning = !lastBackup || (new Date().getTime() - new Date(lastBackup).getTime() > 7 * 24 * 60 * 60 * 1000);

    return (
        <Card className={`border-border shadow-sm ${showWarning ? 'border-amber-500/50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">Backup & Ripristino</CardTitle>
                        <p className="text-sm text-muted-foreground">Gestisci i salvataggi di sicurezza dei tuoi dati.</p>
                    </div>
                </div>
                {showWarning && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-pulse" /> Backup Scaduto
                    </span>
                )}
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Info Box */}
                <div className="flex items-start gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-sm">Politica di Sicurezza</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
                            <li>Esegui un backup almeno una volta a settimana.</li>
                            <li>Il file <code>.json</code> contiene dati sensibili (clienti, fatturati). Custodiscilo con cura.</li>
                            <li>Il ripristino è un'operazione distruttiva: cancella i dati attuali per importare quelli del file.</li>
                        </ul>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    {/* Restore Section */}
                    <div className="w-full sm:w-auto">
                        <input
                            type="file"
                            accept=".json"
                            id="restore-upload"
                            className="hidden"
                            onChange={handleRestoreWrapper}
                            disabled={isRestoring}
                        />
                        <label
                            htmlFor="restore-upload"
                            className={`flex items-center justify-center gap-2 px-6 py-3 border border-dashed border-zinc-600 hover:border-zinc-400 text-muted-foreground hover:text-foreground font-medium rounded-xl transition-all cursor-pointer ${isRestoring ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                            {isRestoring ? 'Ripristino in corso...' : 'Importa Backup (.json)'}
                        </label>
                        {restoreMessage && <p className="text-xs mt-2 text-center font-bold">{restoreMessage}</p>}
                    </div>

                    {/* Export Section */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {isExporting ? 'Generazione...' : 'Scarica Backup Completo'}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
