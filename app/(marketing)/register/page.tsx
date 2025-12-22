"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAgencyAccount } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        agencyName: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    agencyName: formData.agencyName,
                    fullName: `${formData.firstName} ${formData.lastName}`
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Registrazione fallita");
            }

            // Auto-login (optional, or redirect to login)
            // Ideally backend returns a session, but for 'signUp' without auto-confirm we might just redirect.
            // Let's redirect to login for safety and simplicity, or try to auto-signin.
            // For now: Redirect to Login with success message.

            router.push('/login?registered=true');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Si è verificato un errore.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl p-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4 shadow-lg shadow-primary/20">
                        <span className="text-primary-foreground font-bold text-lg">NO</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Crea Account</h1>
                    <p className="text-muted-foreground mt-2">Inizia la prova gratuita di NO.IA v.2</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="text-center py-8 space-y-4">
                    <div className="bg-muted p-6 rounded-2xl border border-border">
                        <p className="text-lg font-medium text-foreground">🚧 Iscrizioni Momentaneamente Chiuse</p>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Stiamo effettuando dei test tecnici per migliorare l'esperienza.
                            <br />
                            Torniamo presto!
                        </p>
                    </div>

                    <Link href="/" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
                        ← Torna alla Home
                    </Link>
                </div>




                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Hai già un account?{' '}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                        Accedi qui
                    </Link>
                </div>
            </div>
        </div >
    );
}
