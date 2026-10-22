import type { Metadata } from "next";
import "./globals.css";
import AppNavbar from "@/components/app-navbar";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Scantified | Ministry Fellowship & Attendance",
  description: "Simple, friendly attendance tracking and session schedules for church ministries and youth camps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FDFBF7] text-slate-900 antialiased selection:bg-amber-200 selection:text-amber-950 font-sans">
        <ToastProvider>
          {/* Ambient Warm Golden Hour Light Halo */}
          <div 
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden" 
            aria-hidden="true"
          >
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-amber-200/20 via-amber-100/10 to-transparent blur-3xl" />
            <div className="absolute top-1/3 -right-40 h-[400px] w-[500px] rounded-full bg-gradient-to-br from-indigo-100/20 via-amber-50/15 to-transparent blur-3xl" />
            <div className="absolute bottom-0 -left-40 h-[450px] w-[550px] rounded-full bg-gradient-to-tr from-amber-100/15 to-transparent blur-3xl" />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col">
            <AppNavbar />
            <div className="flex-1">
              {children}
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
