import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppNavbar from "@/components/app-navbar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DYD26 | Command Center",
  description: "QR Attendance System for DYD26",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppNavbar /> 
        {children}
      </body>
    </html>
  );
}