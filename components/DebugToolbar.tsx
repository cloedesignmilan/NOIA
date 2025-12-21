"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";

export function DebugToolbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const get = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
            setLoading(false);
        };
        get();
        // Also listen
        supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user);
            setLoading(false);
        });
    }, []);

    // ALWAYS RENDER (removed loading return null)

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-xs font-mono p-2 flex justify-between items-center shadow-xl">
            <div className="flex flex-col">
                <span>
                    <strong>DEBUG MODE</strong> | Path: {pathname || 'Unknown'}
                </span>
                <span>
                    Email: <b>"{(user?.email || 'NO USER')}"</b> | ID: {user?.id}
                </span>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    Is SuperAdmin? <b>{user?.email?.toLowerCase() === 'superadmin@noia.cloud' ? 'YES' : 'NO'}</b>
                </div>
                {/* Manual Override */}
                <button
                    onClick={() => window.location.href = '/admin'}
                    className="bg-white text-red-600 px-3 py-1 font-bold rounded shadow hover:bg-gray-100"
                >
                    FORCE ADMIN PAGE
                </button>
            </div>
        </div>
    );
}
