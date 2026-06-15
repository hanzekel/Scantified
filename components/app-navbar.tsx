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
        {/* Brutalist Container - White with lowered opacity & blur */}
        <div className="flex items-center justify-between border-2 border-black bg-white/90 px-5 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] backdrop-blur-sm">
          
          <Link href="/" className="flex items-center gap-3 text-black">
            {/* Brutalist Logo Icon */}
            <div className="flex h-11 w-11 items-center justify-center border-2 border-black bg-[#6345ED] text-lg font-extrabold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              ✝
            </div>

            <div className="leading-tight">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-600">
                Ministry
              </p>
              <p className="text-xl font-black tracking-tight">QR Attendance</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`border-2 px-4 py-2 text-sm font-bold text-black transition-all 
                    ${
                      active
                        ? "border-black bg-[#E5FF2A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[2px] -translate-y-[2px]"
                        : "border-transparent bg-transparent hover:border-black hover:bg-[#E5FF2A] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    }
                  `}
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