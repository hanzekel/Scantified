import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AppNavbar from "@/components/app-navbar";
import PageTransition from "@/components/page-transition";

export default async function Home() {
  const memberCount = await prisma.member.count();
  const sessionCount = await prisma.attendanceSession.count();
  const recordCount = await prisma.attendanceRecord.count();

  return (
    <PageTransition>
      {/* Added inline background color to force the violet theme. 
        You may need to update globals.css if .app-shell overrides this. 
      */}
      <main className="app-shell min-h-screen bg-[#6345ED] font-sans text-white selection:bg-[#E5FF2A] selection:text-black">
        <AppNavbar />

        <section className="mx-auto max-w-7xl px-6 py-12 md:py-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            
            {/* Left Column: Typography & Buttons */}
            <div className="max-w-xl text-left">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#E5FF2A]">
                QR-based Attendance System
              </p>

              <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
                SCANTIFIED
              </h1>

              <p className="mb-6 text-lg leading-relaxed text-white/90">
                Track choir and altar server attendance with a responsive,
                beautiful, and easy-to-use web application built for church
                ministries.
              </p>

              <p className="mb-10 text-xl font-semibold text-white">
                Simple attendance. Clear records. Better ministry coordination.
              </p>

              {/* Scaled-down, properly proportioned buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/members"
                  className="border-2 border-black bg-[#E5FF2A] px-8 py-3.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Open Members
                </Link>

                <Link
                  href="/sessions"
                  className="border-2 border-black bg-white px-8 py-3.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Create Session
                </Link>
              </div>
            </div>

            {/* Right Column: Brutalist Stat Cards */}
            <div className="mx-auto w-full max-w-lg space-y-6 lg:ml-auto">
              
              {/* Members Card */}
              <div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  Members
                </p>
                <h2 className="text-5xl font-black text-black">{memberCount}</h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Registered choir and altar server members
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Sessions Card */}
                <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sessions
                  </p>
                  <h2 className="text-4xl font-black text-black">{sessionCount}</h2>
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    Attendance sessions
                  </p>
                </div>

                {/* Logs Card */}
                <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Logs
                  </p>
                  <h2 className="text-4xl font-black text-black">{recordCount}</h2>
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    Records stored
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tags Section - Redesigned to match the theme */}
          <div className="mt-20 border-t border-white/20 pt-10">
            <p className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-[#E5FF2A]">
              Designed for
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Choir Ministry",
                "Altar Servers",
                "Sunday Attendance",
                "Friday Attendance",
                "QR Scanning",
                "Monthly Reports",
              ].map((tag) => (
                <span
                  key={tag}
                  className="border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}