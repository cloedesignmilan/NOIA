import { Navbar } from "@/components/ui/Navbar";
import { TrialProgressBar } from "@/components/layout/TrialProgressBar";
import { SubscriptionGuard } from "@/components/layout/SubscriptionGuard";
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { SuperAdminGate } from "@/components/SuperAdminGate";
import { DebugToolbar } from "@/components/DebugToolbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SuperAdminGate>
            {/* DebugToolbar can stay for now to help verify identity if Gate allows pass */}
            <DebugToolbar />
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                <OnboardingWizard />
                <TrialProgressBar />
                <SubscriptionGuard>
                    {children}
                </SubscriptionGuard>
            </main>
        </SuperAdminGate>
    );
}
