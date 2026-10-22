"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar, 
  QrCode, 
  Users, 
  BarChart3, 
  Radio, 
  Volume2, 
  VolumeX, 
  Camera, 
  CreditCard, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { isAudioMuted, setAudioMuted } from "@/components/ui/audio";

const ROLE_STORAGE_KEY = "scantified_app_role";

export default function AppNavbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<"attendee" | "staff">("attendee");
  const [isMuted, setIsMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) as "attendee" | "staff" | null;
      if (savedRole === "staff" || savedRole === "attendee") {
        setRole(savedRole);
      } else {
        // Default based on current path: if landing on /reports or /members or /scanner, hint staff
        if (pathname.startsWith("/reports") || pathname.startsWith("/members") || pathname.startsWith("/scanner")) {
          setRole("staff");
        }
      }
      setIsMuted(isAudioMuted());
    } catch {}

    function handleMuteChange() {
      setIsMuted(isAudioMuted());
    }
    window.addEventListener("scantified_audio_muted_changed", handleMuteChange);
    return () => window.removeEventListener("scantified_audio_muted_changed", handleMuteChange);
  }, [pathname]);

  function handleRoleChange(newRole: "attendee" | "staff") {
    setRole(newRole);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch {}
  }

  function toggleMute() {
    const nextState = !isMuted;
    setIsMuted(nextState);
    setAudioMuted(nextState);
  }

  // 100% Distraction-free: hide entire navbar on public check-in and on the Projector Stage
  if (pathname === "/checkin" || pathname.includes("/present")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-amber-200/50 bg-[#FDFBF7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          
          {/* Brand Logo with Apple micro-hover lift */}
          <Link 
            href={role === "staff" ? "/" : "/register"} 
            className="group flex items-center gap-2.5 transition-transform hover:-translate-y-0.5 active:scale-95"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-600/20 transition-transform duration-300 group-hover:scale-105">
              <QrCode size={19} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-amber-800 transition-colors">
                  Scantified
                </span>
                <span className="rounded-full bg-amber-100/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900 border border-amber-200/60">
                  {role === "staff" ? "Staff" : "Fellowship"}
                </span>
              </div>
              <span className="block text-[10px] font-medium text-slate-500 -mt-0.5">
                {role === "staff" ? "Coordinator Console" : "Attendee & Guest Pass"}
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {role === "attendee" ? (
              <>
                <NavLink href="/register" icon={<CreditCard size={15} />} label="My Pass" currentPath={pathname} />
                <NavLink href="/checkin" icon={<CheckCircle2 size={15} />} label="Self Check-In" currentPath={pathname} />
                <NavLink href="/events" icon={<Calendar size={15} />} label="Schedules" currentPath={pathname} />
              </>
            ) : (
              <>
                <NavLink href="/" icon={<Radio size={15} />} label="Sessions" currentPath={pathname} />
                <NavLink href="/reports" icon={<BarChart3 size={15} />} label="Live Monitor" currentPath={pathname} />
                <NavLink href="/members" icon={<Users size={15} />} label="People" currentPath={pathname} />
                <NavLink href="/events" icon={<Calendar size={15} />} label="Schedules" currentPath={pathname} />
                <NavLink href="/scanner" icon={<Camera size={15} />} label="Scanner" currentPath={pathname} />
              </>
            )}
          </nav>

          {/* Controls: Segmented Role Pill + Quiet Mute Toggle */}
          <div className="flex items-center gap-2">
            
            {/* Segmented Role Switcher */}
            <div className="flex items-center rounded-2xl border border-amber-200/70 bg-amber-50/50 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => handleRoleChange("attendee")}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  role === "attendee"
                    ? "bg-white text-amber-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Switch to Attendee Mode"
              >
                <span>👤</span>
                <span className="hidden sm:inline">Attendee</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("staff")}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                  role === "staff"
                    ? "bg-slate-900 text-amber-300 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Switch to Staff Mode"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Staff</span>
              </button>
            </div>

            {/* Mute Toggle (Subtle Speaker Icon) */}
            <button
              type="button"
              onClick={toggleMute}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                isMuted
                  ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "border-amber-200/70 bg-white text-slate-600 hover:bg-amber-50/70 hover:text-amber-800"
              }`}
              title={isMuted ? "Sound muted (Quiet service mode)" : "Sound enabled"}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

          </div>

        </div>
      </header>

      {/* Mobile Bottom Tab Bar (iOS Native Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-amber-200/60 bg-[#FDFBF7]/95 px-3 py-2 backdrop-blur-xl shadow-lg shadow-amber-950/5">
        <div className="flex items-center justify-around">
          {role === "attendee" ? (
            <>
              <MobileTabLink href="/register" icon={<CreditCard size={18} />} label="My Pass" currentPath={pathname} />
              <MobileTabLink href="/checkin" icon={<CheckCircle2 size={18} />} label="Check-In" currentPath={pathname} />
              <MobileTabLink href="/events" icon={<Calendar size={18} />} label="Schedules" currentPath={pathname} />
            </>
          ) : (
            <>
              <MobileTabLink href="/" icon={<Radio size={18} />} label="Sessions" currentPath={pathname} />
              <MobileTabLink href="/reports" icon={<BarChart3 size={18} />} label="Monitor" currentPath={pathname} />
              <MobileTabLink href="/members" icon={<Users size={18} />} label="People" currentPath={pathname} />
              <MobileTabLink href="/events" icon={<Calendar size={18} />} label="Schedules" currentPath={pathname} />
              <MobileTabLink href="/scanner" icon={<Camera size={18} />} label="Scanner" currentPath={pathname} />
            </>
          )}
        </div>
      </nav>
    </>
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
      className={`nav-pill relative flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 ${
        isActive
          ? "bg-slate-900 text-amber-300 shadow-sm"
          : "text-slate-600 hover:bg-amber-100/50 hover:text-slate-950"
      }`}
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      <span>{label}</span>
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-amber-400" />
      )}
    </Link>
  );
}

function MobileTabLink({
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
      className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all active:scale-90 ${
        isActive ? "text-amber-800 font-bold" : "text-slate-400 font-medium"
      }`}
    >
      <div className={`p-1 rounded-xl transition-colors ${isActive ? "bg-amber-100/80 text-amber-900" : ""}`}>
        {icon}
      </div>
      <span className="text-[10px] tracking-tight">{label}</span>
    </Link>
  );
}

