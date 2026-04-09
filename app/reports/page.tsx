"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppNavbar from "@/components/app-navbar";
import PageTransition from "@/components/page-transition";

type TopMember = {
  fullName: string;
  ministry: string;
  role: string;
  total: number;
};

type GroupTotal = {
  name: string;
  total: number;
};

type MonthlyReport = {
  totalRecords: number;
  topPresentMembers: TopMember[];
  topAbsentMembers: TopMember[];
  totalsByMinistry: GroupTotal[];
  totalsByType: GroupTotal[];
};

export default function ReportsPage() {
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchReport() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/reports/monthly?month=${month}&year=${year}`
      );
      const data = await res.json();

      if (!res.ok) {
        console.error(data.error || "Failed to fetch report");
        setLoading(false);
        return;
      }

      setReport(data);
    } catch (error) {
      console.error("fetchReport error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <main className="app-shell">
      <AppNavbar />

      <section className="section-container relative z-10 py-10 text-white">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
              Ministry QR Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Monthly Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Review attendance summaries and export your records to Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/records" className="secondary-button">
              ← Back
            </Link>

            <a href="/api/reports/export" className="primary-button">
              Export Excel
            </a>
          </div>
        </div>

        <div className="glass-card rounded-[28px] p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                Reports Overview
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">
                Monthly Attendance Summary
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Generate attendance summaries by month and export them for
                ministry reporting.
              </p>
            </div>

            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
              {report ? `Total Records: ${report.totalRecords}` : "No Report Loaded"}
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1} className="text-black">
                  Month {i + 1}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white placeholder:text-white/60"
              placeholder="Year"
            />

            <button onClick={fetchReport} className="primary-button w-full">
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>

          {!report ? (
            <div className="rounded-3xl border border-white/15 bg-white/10 p-10 text-center">
              <p className="text-lg font-semibold text-white">
                No report loaded yet
              </p>
              <p className="mt-2 text-sm text-white/75">
                Choose a month and year, then generate a report.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                  Total Records
                </p>
                <h2 className="mt-3 text-4xl font-extrabold text-white">
                  {report.totalRecords}
                </h2>
                <p className="mt-2 text-sm text-white/75">
                  Total attendance logs for the selected month.
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 lg:col-span-2">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                  Top Present Members
                </p>

                <div className="mt-4 space-y-3">
                  {report.topPresentMembers.length === 0 ? (
                    <p className="text-white/75">No data for this month.</p>
                  ) : (
                    report.topPresentMembers.map((member, index) => (
                      <div
                        key={`${member.fullName}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/10 p-4"
                      >
                        <p className="font-bold text-white">{member.fullName}</p>
                        <p className="text-sm text-white/80">
                          {member.ministry} • {member.role}
                        </p>
                        <p className="mt-1 text-sm text-white/90">
                          Total Present: {member.total}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 lg:col-span-2">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                  Top Absent Members
                </p>

                <div className="mt-4 space-y-3">
                  {report.topAbsentMembers.length === 0 ? (
                    <p className="text-white/75">No absence data for this month.</p>
                  ) : (
                    report.topAbsentMembers.map((member, index) => (
                      <div
                        key={`${member.fullName}-absent-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/10 p-4"
                      >
                        <p className="font-bold text-white">{member.fullName}</p>
                        <p className="text-sm text-white/80">
                          {member.ministry} • {member.role}
                        </p>
                        <p className="mt-1 text-sm text-white/90">
                          Total Absent: {member.total}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-6">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                  By Ministry
                </p>

                <div className="mt-4 space-y-3">
                  {report.totalsByMinistry.length === 0 ? (
                    <p className="text-white/75">No data available.</p>
                  ) : (
                    report.totalsByMinistry.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4"
                      >
                        <span className="font-semibold text-white">
                          {item.name}
                        </span>
                        <span className="text-white/90">{item.total}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 lg:col-span-2">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                  By Attendance Type
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {report.totalsByType.length === 0 ? (
                    <p className="text-white/75">No data available.</p>
                  ) : (
                    report.totalsByType.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4"
                      >
                        <span className="font-semibold text-white">
                          {item.name}
                        </span>
                        <span className="text-white/90">{item.total}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}