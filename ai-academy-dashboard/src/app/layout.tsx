import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Academy Dashboard",
  description: "AI Academy Dashboard - Progress Tracking & Leaderboard",
  icons: {
    icon: "/icons/icon.svg",
    shortcut: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0062FF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <AuthProvider>
          <AuthGuard>
            <Navigation />
            <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 lg:pb-6">
              {children}
            </main>
            <MobileBottomNav />
            <Toaster />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
