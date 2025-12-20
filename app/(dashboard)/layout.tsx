import { Navbar } from "@/components/ui/Navbar";
import { TrialProgressBar } from "@/components/layout/TrialProgressBar";
import { SubscriptionGuard } from "@/components/layout/SubscriptionGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                <TrialProgressBar />
                <SubscriptionGuard>
                    {children}
                </SubscriptionGuard>
            </main>
        </>
    );
}
