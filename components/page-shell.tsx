"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function PageShell({
  title,
  subtitle,
  children,
}: PageShellProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[linear-gradient(to_bottom_right,_#f8fbff,_#eef6ff)]">
      <div className="section-container py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">
              Ministry QR Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Back
            </button>

            <Link
              href="/"
              className="rounded-full bg-slate-900 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Exit to Home
            </Link>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}