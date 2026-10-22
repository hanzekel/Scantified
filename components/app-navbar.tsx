"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, QrCode, Users, BarChart3, Radio, Sparkles } from "lucide-react";

export default function AppNavbar() {
  const pathname = usePathname();

  // Hide the navbar on public self-check-in to maximize screen focus
  if (pathname === "/checkin") return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200/40 bg-[#FDFBF7]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Brand / Logo with Apple micro-hover lift */}
        <Link 
          href="/" 
          className="group flex items-center gap-3 transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-600/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1">
            <QrCode size={20} strokeWidth={2.3} />
            <div className="absolute -inset-1 rounded-2xl bg-amber-400/25 blur-sm -z-10 group-hover:bg-amber-400/40 transition-colors" />
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight text-slate-900 group-hover:text-amber-800 transition-colors">
              Scantified
            </span>
            <span className="block text-[11px] font-medium tracking-wide text-amber-800/80 -mt-1 flex items-center gap-1.5">
              <span>Church & Ministry</span>
              <span className="inline-block h-1 w-1 rounded-full bg-amber-500/60" />
              <span className="text-[10px] text-amber-700/70">Attendance</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links with iOS-style pill hover physics */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/events" icon={<Calendar size={15} />} label="Schedules" currentPath={pathname} />
          <NavLink href="/" icon={<Radio size={15} />} label="Sessions" currentPath={pathname} />
          <NavLink href="/members" icon={<Users size={15} />} label="People" currentPath={pathname} />
          <NavLink href="/reports" icon={<BarChart3 size={15} />} label="Live Tracker" currentPath={pathname} />
        </nav>

      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  label,
  currentPath,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  currentPath: string;
}) {
  const isActive = currentPath === href || (href !== "/" && currentPath.startsWith(href));

  return (
    <Link
      href={href}
      className={`nav-pill relative flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold tracking-tight transition-all duration-200 ${
        isActive
          ? "bg-slate-900 text-amber-300 shadow-md shadow-slate-900/15"
          : "text-slate-600 hover:bg-amber-100/50 hover:text-slate-950"
      }`}
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      <span className="hidden sm:inline-block">{label}</span>
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3.5 rounded-full bg-amber-400" />
      )}
    </Link>
  );
}
