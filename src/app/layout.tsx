import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { MobileNavWrapper } from "@/components/mobile-nav-wrapper";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "OKR System — Міряй Важливе",
  description: "Система управління цілями та ключовими результатами",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className={`${jakarta.variable} ${jetbrains.variable} antialiased`} style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        <TooltipProvider>
          <MobileNavWrapper />
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar hidden on mobile */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto bg-[#fafbfc] pt-[60px] lg:pt-0">{children}</main>
          </div>
        </TooltipProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
