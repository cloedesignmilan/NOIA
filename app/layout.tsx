import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { TrialProgressBar } from "@/components/layout/TrialProgressBar";
import { SubscriptionGuard } from "@/components/layout/SubscriptionGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NO.IA v.2 - Finance Manager",
  description: "Advanced Real Estate Financial Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <TrialProgressBar />
            <SubscriptionGuard>
              {children}
            </SubscriptionGuard>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
