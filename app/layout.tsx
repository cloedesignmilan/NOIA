import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { ThemeProvider } from "@/components/theme-provider";
import { DebugToolbar } from "@/components/DebugToolbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NO.IA v.2 - Finance Manager",
  description: "Advanced Real Estate Financial Management",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <DebugToolbar />
          <SuperAdminGuard />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
