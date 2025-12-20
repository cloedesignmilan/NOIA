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
            const fullName = `${formData.firstName} ${formData.lastName}`;
            await createAgencyAccount(formData.email, formData.password, formData.agencyName, fullName);
            router.push('/dashboard');
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</label>
                            <input
                                name="firstName"
                                required
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Mario"
                                className="w-full input-premium px-4 py-3"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cognome</label>
                            <input
                                name="lastName"
                                required
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Rossi"
                                className="w-full input-premium px-4 py-3"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome Agenzia</label>
                        <input
                            name="agencyName"
                            required
                            type="text"
                            value={formData.agencyName}
                            onChange={handleChange}
                            placeholder="Immobiliare Srl"
                            className="w-full input-premium px-4 py-3"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                        <input
                            name="email"
                            required
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="nome@agenzia.it"
                            className="w-full input-premium px-4 py-3"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                        <input
                            name="password"
                            required
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full input-premium px-4 py-3"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all mt-4 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crea Account Agenzia"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Hai già un account?{' '}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                        Accedi qui
                    </Link>
                </div>
            </div>
        </div>
    );
}
