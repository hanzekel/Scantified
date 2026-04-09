"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/members", label: "Members" },
  { href: "/sessions", label: "Sessions" },
  { href: "/scanner", label: "Scanner" },
  { href: "/records", label: "Records" },
  { href: "/reports", label: "Reports" },
];

export default function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="relative z-20">
      <div className="section-container py-6">
        <div className="glass-nav flex items-center justify-between rounded-full px-5 py-4">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-extrabold">
              ✝
            </div>

            <div className="leading-tight">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/70">
                Ministry
              </p>
              <p className="text-xl font-extrabold">QR Attendance</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${
                    active ? "underline underline-offset-8" : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}