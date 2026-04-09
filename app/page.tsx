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
    <main className="app-shell">
      <AppNavbar />

      <section className="section-container flex min-h-[calc(100vh-110px)] items-center py-10 text-white">
        <div className="w-full text-center">
          <div className="mx-auto max-w-5xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-white/75">
              QR-based Attendance System for your Ministry
            </p>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
              SCANTIFIED
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/90 sm:text-xl">
              Track choir and altar server attendance with a responsive,
              beautiful, and easy-to-use web application built for church
              ministries.
            </p>

            <p className="mt-8 text-2xl font-semibold text-white">
              Simple attendance. Clear records. Better ministry coordination.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/members" className="primary-button">
                Open Members
              </Link>

              <Link href="/sessions" className="secondary-button">
                Create Session
              </Link>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              <div className="glass-card rounded-[28px] p-6 text-left">
                <p className="text-sm uppercase tracking-[0.2em] text-white/75">
                  Members
                </p>
                <h2 className="mt-2 text-4xl font-extrabold">{memberCount}</h2>
                <p className="mt-2 text-sm text-white/85">
                  Registered choir and altar server members
                </p>
              </div>

              <div className="glass-card rounded-[28px] p-6 text-left">
                <p className="text-sm uppercase tracking-[0.2em] text-white/75">
                  Sessions
                </p>
                <h2 className="mt-2 text-4xl font-extrabold">{sessionCount}</h2>
                <p className="mt-2 text-sm text-white/85">
                  Attendance sessions created for church days
                </p>
              </div>

              <div className="glass-card rounded-[28px] p-6 text-left">
                <p className="text-sm uppercase tracking-[0.2em] text-white/75">
                  Logs
                </p>
                <h2 className="mt-2 text-4xl font-extrabold">{recordCount}</h2>
                <p className="mt-2 text-sm text-white/85">
                  Attendance records scanned and stored
                </p>
              </div>
            </div>

            <div className="glass-card mx-auto mt-14 max-w-3xl rounded-[32px] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
                Designed for
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold">
                  Choir Ministry
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold">
                  Altar Servers
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold">
                  Sunday Attendance
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold">
                  Friday Attendance
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold">
                  QR Scanning
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold">
                  Monthly Reports
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    </PageTransition>
  );
}