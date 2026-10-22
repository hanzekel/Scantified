"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { BarChart3, FileSpreadsheet, Users, CheckCircle2, Clock, Radio, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Session = { id: number; title: string; eventDay: number };
type ReportRow = {
  id: number;
  fullName: string;
  campName: string;
  role: string;
  status: "Present" | "Absent";
  timeIn: string | null;
};

export default function ReportsPage() {
  const toast = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch available sessions on load
  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data))
      .catch((err) => console.error(err));
  }, []);

  // 2. LIVE SYNC: Fetch report data every 5 seconds when a session is selected
  useEffect(() => {
    if (!selectedSession) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports?sessionId=${selectedSession}`);
        if (res.ok) {
          setReportData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchReport();

    const interval = setInterval(fetchReport, 5000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  // 3. Export to Excel Logic (Organized by Camp)
  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast.error("No data to export for this session.");
      return;
    }

    const excelData = reportData.map((row) => ({
      "Camp / Group": row.campName,
      "Attendee Name": row.fullName,
      "Role": row.role,
      "Status": row.status,
      "Time Checked In": row.timeIn ? new Date(row.timeIn).toLocaleTimeString() : "---",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const sessionTitle =
      sessions.find((s) => s.id.toString() === selectedSession)?.title || "Report";
    XLSX.writeFile(workbook, `Scantified_${sessionTitle.replace(/\s+/g, "_")}.xlsx`);
    toast.success("Excel report downloaded!");
  };

  const totalCampers = reportData.length;
  const totalPresent = reportData.filter((r) => r.status === "Present").length;
  const totalAbsent = totalCampers - totalPresent;
  const attendanceRate = totalCampers > 0 ? Math.round((totalPresent / totalCampers) * 100) : 0;

  const filteredRows = reportData.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.campName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-5xl">
        
        {/* Header Bar */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-amber-200/60 bg-white/85 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-900 border border-amber-200/70 mb-2">
              <Radio size={13} className="text-amber-600 animate-pulse" />
              <span>Live Multi-Device Attendance</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Live Attendance Monitor
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Watch attendee check-ins in real time on any phone or laptop, and download an Excel spreadsheet anytime.
            </p>
          </div>

          <button
            onClick={exportToExcel}
            disabled={!selectedSession || reportData.length === 0}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-xs font-semibold text-white shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-emerald-800 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            <span>Download Excel Sheet (.xlsx)</span>
          </button>
        </header>

        {/* Session Selector Card */}
        <div className="warm-card mb-8 p-6">
          <label className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Choose which session gathering to monitor:
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full rounded-2xl border border-amber-200/80 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm transition-all focus:border-amber-600"
          >
            <option value="">-- Choose an active session --</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                Day {session.eventDay}: {session.title}
              </option>
            ))}
          </select>
        </div>

        {/* Stats & Live Table */}
        {selectedSession && (
          <div>
            {/* Live Stats Strip with User-Friendly Names */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-amber-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Enrolled
                </span>
                <span className="mt-1 text-2xl font-bold text-slate-900">{totalCampers}</span>
              </div>

              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 shadow-sm">
                <span className="flex items-center justify-between text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                  <span>Present in Venue</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                    Live
                  </span>
                </span>
                <span className="mt-1 text-2xl font-bold text-emerald-800">{totalPresent}</span>
              </div>

              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 shadow-sm">
                <span className="block text-[10px] font-semibold text-rose-800 uppercase tracking-wider">
                  Not Checked In Yet
                </span>
                <span className="mt-1 text-2xl font-bold text-rose-800">{totalAbsent}</span>
              </div>

              <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500 to-amber-700 p-4 shadow-md shadow-amber-700/15 text-white">
                <span className="block text-[10px] font-semibold text-amber-100 uppercase tracking-wider">
                  Attendance %
                </span>
                <span className="mt-1 text-2xl font-bold text-white">{attendanceRate}%</span>
              </div>
            </div>

            {/* Filter Input */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Live Attendance Records
              </h2>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or group..."
                  className="w-full rounded-2xl border border-amber-200/80 bg-white/90 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 transition-all focus:border-amber-600 shadow-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Table */}
            {loading && reportData.length === 0 ? (
              <div className="rounded-3xl border border-amber-200/60 bg-white/80 p-12 text-center backdrop-blur-md">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-700">Connecting live sync...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-amber-200/60 bg-white/90 shadow-sm backdrop-blur-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-amber-200/60 bg-amber-50/50">
                      <th className="p-3.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">Attendee</th>
                      <th className="p-3.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Camp / Group</th>
                      <th className="p-3.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Role</th>
                      <th className="p-3.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Status</th>
                      <th className="p-3.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">Time Checked In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 font-medium">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 text-sm">
                          {row.fullName}
                        </td>
                        <td className="p-3 text-slate-600">
                          <span className="rounded-full bg-amber-100/70 border border-amber-200/80 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            {row.campName}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{row.role}</td>
                        <td className="p-3">
                          {row.status === "Present" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                              Absent
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">
                          {row.timeIn ? (
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>{new Date(row.timeIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </span>
                          ) : (
                            "---"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
