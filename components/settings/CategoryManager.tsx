"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader2, FolderOpen, ArrowUp, ArrowDown, Users, Building2, Megaphone, Laptop, Car, Scale, Receipt, Landmark, BookOpen, AlertCircle, Handshake, Briefcase, TrendingUp, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import { cn } from '@/lib/utils';

// Shared Macros (should match the ones in Forms)
const INCOME_MACROS = [
    { id: 'intermediazione', label: 'Intermediazione', icon: Handshake },
    { id: 'servizi', label: 'Servizi', icon: Briefcase },
    { id: 'flusso', label: 'Flusso', icon: TrendingUp },
    { id: 'altro', label: 'Altro', icon: Layers },
];

const EXPENSE_MACROS = [
    { id: 'personale', label: 'Costi per agenti e collaboratori', icon: Users },
    { id: 'ufficio', label: 'Costi di ufficio', icon: Building2 },
    { id: 'marketing', label: 'Marketing & pubblicità', icon: Megaphone },
    { id: 'trasporti', label: 'Trasporti & trasferte', icon: Car },
    { id: 'tecnologia', label: 'Software & strumenti digitali', icon: Laptop },
    { id: 'consulenze', label: 'Consulenze & professionisti', icon: Scale },
    { id: 'amministrativi', label: 'Costi amministrativi', icon: Receipt },
    { id: 'fisco', label: 'Imposte e tributi', icon: Landmark },
    { id: 'formazione', label: 'Formazione & crescita', icon: BookOpen },
    { id: 'varie', label: 'Altre spese', icon: AlertCircle },
];

export function CategoryManager() {
    const { orgId } = useCurrentOrg();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [section, setSection] = useState<'income' | 'expense'>('income');
    const [selectedMacro, setSelectedMacro] = useState<string>('');

    // Add New
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        if (orgId) fetchCategories();
    }, [orgId]);

    useEffect(() => {
        // Set default macro when section changes
        if (section === 'income') setSelectedMacro(INCOME_MACROS[0].id);
        else setSelectedMacro(EXPENSE_MACROS[0].id);
    }, [section]);

    const fetchCategories = async () => {
        // Use API to bypass RLS
        setLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) return;

            const res = await fetch('/api/settings/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const debugOrg = res.headers.get('X-Debug-Org-ID');

                console.log("Categories loaded:", data);
                if (Array.isArray(data)) {
                    setCategories(data);
                    if (data.length === 0) alert(`DEBUG: 0 Categorie.\nOrgID API: ${debugOrg}`);
                } else {
                    alert("DEBUG: Formato dati non valido.");
                }
            } else {
                const err = await res.json();
                alert(`DEBUG ERROR: ${err.error || res.statusText}`);
            }
        } catch (error: any) {
            console.error("Error fetching categories:", error);
            alert(`DEBUG EXCEPTION: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategoryName.trim() || !orgId) return;
        setIsAdding(true);

        const currentList = categories.filter(c => c.section === section && c.macro_category === selectedMacro);
        const maxOrder = currentList.length > 0 ? Math.max(...currentList.map(c => c.sort_order || 0)) : 0;

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch('/api/settings/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    section,
                    macro_category: selectedMacro,
                    name: newCategoryName.trim(),
                    sort_order: maxOrder + 1
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCategories(prev => [...prev, data]);
                setNewCategoryName('');
            } else {
                alert("Errore salvataggio categoria");
            }
        } catch (e) {
            console.error("Add Error", e);
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch('/api/settings/categories', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id, name: editName.trim() })
        });

        if (res.ok) {
            setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
            setEditingId(null);
            setEditName('');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return;

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch(`/api/settings/categories?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down', list: any[]) => {
        // UI-only reorder for now to avoid breaking changes
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === list.length - 1) return;
    };

    const currentMacros = section === 'income' ? INCOME_MACROS : EXPENSE_MACROS;
    // Sort local filtering just in case state update didn't auto-sort or initial fetch order
    const filteredCategories = categories
        .filter(c => c.section === section && c.macro_category === selectedMacro)
        .sort((a, b) => {
            const orderA = a.sort_order || 0;
            const orderB = b.sort_order || 0;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
        });

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Gestione Categorie</h2>
                    <p className="text-sm text-muted-foreground">Personalizza le categorie per Entrate e Spese</p>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex p-1 bg-muted/50 rounded-xl mb-6 w-full sm:w-fit">
                <button
                    onClick={() => setSection('income')}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        section === 'income' ? "bg-background text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Entrate
                </button>
                <button
                    onClick={() => setSection('expense')}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        section === 'expense' ? "bg-background text-red-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Spese
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Macro List */}
                <div className="md:col-span-1 flex flex-row md:grid md:grid-cols-2 gap-2 overflow-x-auto pb-2 md:pb-0">
                    {currentMacros.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMacro(m.id)}
                            title={m.label}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl transition-all aspect-square",
                                selectedMacro === m.id
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-muted/30 hover:bg-muted text-muted-foreground"
                            )}
                        >
                            <span className="sr-only">{m.label}</span>
                            <m.icon className="w-6 h-6 opacity-80" />
                        </button>
                    ))}
                </div>

                {/* Categories List */}
                <div className="md:col-span-3 bg-muted/20 rounded-2xl p-4 border border-border/50 min-h-[300px]">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4 px-2">
                        Categorie in "{currentMacros.find(m => m.id === selectedMacro)?.label}"
                    </h3>

                    <div className="space-y-2">
                        {loading && <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>}

                        {!loading && filteredCategories.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground opacity-50 text-sm">
                                Nessuna categoria presente
                            </div>
                        )}

                        {filteredCategories.map((cat, index) => (
                            <div key={cat.id} className="group flex items-center justify-between p-3 bg-background border border-border/50 rounded-xl hover:border-primary/30 transition-all">
                                {editingId === cat.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 bg-muted px-3 py-1.5 rounded-lg border focus:border-primary outline-none text-sm"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                                        />
                                        <button onClick={() => handleUpdate(cat.id)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-sm pl-2">{cat.name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-0.5 mr-2 border-r border-border/50 pr-2">
                                                <button disabled={index === 0} onClick={() => handleMove(index, 'up', filteredCategories)} className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                                                <button disabled={index === filteredCategories.length - 1} onClick={() => handleMove(index, 'down', filteredCategories)} className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                                            </div>
                                            <button
                                                onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-100 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Add New Input */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                            <input
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                placeholder="Nuova categoria..."
                                className="flex-1 bg-background px-4 py-2.5 rounded-xl border border-border focus:border-primary outline-none text-sm"
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            />
                            <button
                                onClick={handleAdd}
                                disabled={isAdding || !newCategoryName.trim()}
                                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
