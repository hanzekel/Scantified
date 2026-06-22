"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Activity, QrCode } from "lucide-react";

export default function AppNavbar() {
  const pathname = usePathname();

  // Hide the admin navbar if the user is on the public registration page
  if (pathname === "/register") return null;

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-black bg-[#6345ED] text-white shadow-[0px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4 px-6 md:px-12">
        
        {/* Brand / Home Link */}
        <Link 
          href="/" 
          className="flex items-center gap-2 transition-transform hover:-translate-x-1 hover:-translate-y-1"
        >
          <div className="flex h-10 w-10 items-center justify-center border-2 border-white bg-[#E5FF2A] text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <QrCode size={24} strokeWidth={3} />
          </div>
          <span className="text-2xl font-black uppercase tracking-widest text-[#E5FF2A] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            DYD26
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0">
          <NavLink href="/" icon={<Home size={18} />} label="Sessions" currentPath={pathname} />
          <NavLink href="/members" icon={<Users size={18} />} label="Campers" currentPath={pathname} />
          <NavLink href="/reports" icon={<Activity size={18} />} label="Live Tracker" currentPath={pathname} />
        </div>

      </div>
    </nav>
  );
}

function NavLink({ href, icon, label, currentPath }: { href: string; icon: React.ReactNode; label: string; currentPath: string }) {
  const isActive = currentPath === href || (href !== "/" && currentPath.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 border-2 border-black px-4 py-2 text-sm font-black uppercase transition-transform hover:-translate-y-1 ${
        isActive 
          ? "bg-[#E5FF2A] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
          : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      }`}
    >
      {icon}
      <span className="hidden sm:inline-block">{label}</span>
    </Link>
  );
}