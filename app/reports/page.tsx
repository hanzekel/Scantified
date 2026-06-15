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
    <main className="app-shell min-h-screen bg-[#6345ED] selection:bg-[#E5FF2A] selection:text-black">
      <AppNavbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        
        {/* Page Header Banner */}
        <div className="mb-8 flex flex-col gap-6 border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#6345ED]">
              Ministry QR Attendance
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-black">
              Monthly Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Review attendance summaries and export your records to Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/records"
              className="border-2 border-black bg-white px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              ← Back
            </Link>

            <a
              href="/api/reports/export"
              className="border-2 border-black bg-[#E5FF2A] px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Export Excel
            </a>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-6 flex flex-col gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Reports Overview
              </p>
              <h2 className="mt-1 text-2xl font-black text-black">
                Monthly Attendance Summary
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                Generate attendance summaries by month and export them for
                ministry reporting.
              </p>
            </div>

            <div className="flex h-fit items-center whitespace-nowrap border-2 border-black bg-[#E5FF2A] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {report ? `Total Records: ${report.totalRecords}` : "No Report Loaded"}
            </div>
          </div>

          {/* Filters Grid */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            
            {/* Month Filter */}
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full appearance-none border-2 border-black bg-white p-3.5 pr-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Month {i + 1}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l-2 border-black bg-slate-100 px-4 text-black">
                ▼
              </div>
            </div>

            {/* Year Input */}
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border-2 border-black bg-white p-3.5 text-black placeholder:text-slate-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              placeholder="Year"
            />

            {/* Generate Button */}
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full border-2 border-black bg-[#E5FF2A] p-3.5 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>

          {!report ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-black bg-slate-50 p-12 text-center shadow-inner">
              <p className="text-xl font-black text-black">
                No report loaded yet
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Choose a month and year, then generate a report.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* Total Records Stat Card (Yellow Accent) */}
              <div className="border-2 border-black bg-[#E5FF2A] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-bold uppercase tracking-widest text-black">
                  Total Records
                </p>
                <h2 className="mt-3 text-6xl font-black text-black">
                  {report.totalRecords}
                </h2>
                <p className="mt-4 text-sm font-medium text-slate-800 border-t-2 border-black/10 pt-3">
                  Total attendance logs for the selected month.
                </p>
              </div>

              {/* Top Present Members */}
              <div className="border-2 border-black bg-slate-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b-2 border-black pb-3">
                  Top Present Members
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {report.topPresentMembers.length === 0 ? (
                    <p className="text-sm font-medium text-slate-600">No data for this month.</p>
                  ) : (
                    report.topPresentMembers.map((member, index) => (
                      <div
                        key={`${member.fullName}-${index}`}
                        className="border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                      >
                        <p className="font-black text-black text-lg">{member.fullName}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                          {member.ministry} • {member.role}
                        </p>
                        <p className="mt-3 text-sm font-bold text-[#6345ED]">
                          Total Present: <span className="text-lg text-black">{member.total}</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Absent Members */}
              <div className="border-2 border-black bg-slate-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-2 lg:col-start-2">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b-2 border-black pb-3">
                  Top Absent Members
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {report.topAbsentMembers.length === 0 ? (
                    <p className="text-sm font-medium text-slate-600">No absence data for this month.</p>
                  ) : (
                    report.topAbsentMembers.map((member, index) => (
                      <div
                        key={`${member.fullName}-absent-${index}`}
                        className="border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                      >
                        <p className="font-black text-black text-lg">{member.fullName}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                          {member.ministry} • {member.role}
                        </p>
                        <p className="mt-3 text-sm font-bold text-[#FF4A4A]">
                          Total Absent: <span className="text-lg text-black">{member.total}</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals By Ministry */}
              <div className="border-2 border-black bg-slate-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-start-1 lg:row-start-2">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b-2 border-black pb-3">
                  By Ministry
                </p>

                <div className="mt-4 space-y-3">
                  {report.totalsByMinistry.length === 0 ? (
                    <p className="text-sm font-medium text-slate-600">No data available.</p>
                  ) : (
                    report.totalsByMinistry.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <span className="font-bold text-black">
                          {item.name}
                        </span>
                        <span className="font-black text-lg text-black bg-slate-100 px-2 border-2 border-black">{item.total}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals By Attendance Type */}
              <div className="border-2 border-black bg-slate-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:col-span-3">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b-2 border-black pb-3">
                  By Attendance Type
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {report.totalsByType.length === 0 ? (
                    <p className="text-sm font-medium text-slate-600">No data available.</p>
                  ) : (
                    report.totalsByType.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <span className="font-bold text-black text-sm">
                          {item.name}
                        </span>
                        <span className="font-black text-lg text-black bg-[#E5FF2A] px-2 border-2 border-black">{item.total}</span>
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