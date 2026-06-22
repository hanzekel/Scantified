"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // Retaining your Excel dependency

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch available sessions on load
  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data));
  }, []);

  // 2. LIVE SYNC: Fetch report data every 5 seconds when a session is selected
  useEffect(() => {
    if (!selectedSession) return;

    const fetchReport = async () => {
      const res = await fetch(`/api/reports?sessionId=${selectedSession}`);
      if (res.ok) setReportData(await res.json());
      setLoading(false);
    };

    setLoading(true);
    fetchReport(); // Initial fetch

    // The Magic: Auto-refresh every 5 seconds so multiple devices stay perfectly in sync visually
    const interval = setInterval(fetchReport, 5000); 
    return () => clearInterval(interval);
  }, [selectedSession]);

  // 3. Export to Excel Logic (Organized by Camp)
  const exportToExcel = () => {
    if (reportData.length === 0) return alert("No data to export.");

    // Format data specifically for the Excel columns
    const excelData = reportData.map((row) => ({
      "Camp Name": row.campName,
      "Camper Name": row.fullName,
      "Role": row.role,
      "Status": row.status,
      "Time In": row.timeIn ? new Date(row.timeIn).toLocaleTimeString() : "---",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Generate filename based on session
    const sessionTitle = sessions.find((s) => s.id.toString() === selectedSession)?.title || "Report";
    XLSX.writeFile(workbook, `DYD26_${sessionTitle.replace(/\s+/g, "_")}.xlsx`);
  };

  // Calculate quick stats
  const totalCampers = reportData.length;
  const totalPresent = reportData.filter((r) => r.status === "Present").length;

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans selection:bg-[#E5FF2A] selection:text-black md:p-12">
      <div className="mx-auto max-w-5xl">
        
        <header className="mb-10 border-b-4 border-black pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black md:text-5xl">
            Live Command Center
          </h1>
          <p className="mt-2 text-lg font-bold text-[#FF4A4A]">
            Real-time multi-device sync & Excel exports.
          </p>
        </header>

        {/* Controls */}
        <div className="mb-8 flex flex-col items-end gap-4 md:flex-row border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-full md:w-1/2">
            <label className="mb-2 block font-bold uppercase text-black">Select Session to Monitor</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full border-2 border-black bg-slate-50 p-3 font-bold outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="">-- Choose a Session --</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  Day {session.eventDay}: {session.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportToExcel}
            disabled={!selectedSession || reportData.length === 0}
            className="w-full border-2 border-black bg-[#4ADE80] p-3 font-black uppercase text-black transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 md:w-auto"
          >
            Download Excel ↓
          </button>
        </div>

        {/* Stats & Table */}
        {selectedSession && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-6">
              <div className="border-4 border-black bg-[#6345ED] p-6 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-bold uppercase tracking-widest text-[#E5FF2A]">Total Registered</p>
                <p className="text-5xl font-black">{totalCampers}</p>
              </div>
              <div className="border-4 border-black bg-[#E5FF2A] p-6 text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p className="flex items-center justify-between text-sm font-bold uppercase tracking-widest">
                  Present in Venue
                  <span className="animate-pulse rounded-full bg-[#FF4A4A] px-2 py-1 text-xs text-white">Live</span>
                </p>
                <p className="text-5xl font-black">{totalPresent}</p>
              </div>
            </div>

            {loading && reportData.length === 0 ? (
              <p className="text-xl font-bold uppercase">Loading data...</p>
            ) : (
              <div className="overflow-x-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <table className="w-full text-left">
                  <thead className="border-b-4 border-black bg-slate-100">
                    <tr>
                      <th className="p-4 font-black uppercase text-black">Camp</th>
                      <th className="p-4 font-black uppercase text-black">Camper Name</th>
                      <th className="p-4 font-black uppercase text-black">Status</th>
                      <th className="p-4 font-black uppercase text-black">Time In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, index) => (
                      <tr key={row.id} className={index !== reportData.length - 1 ? "border-b-2 border-slate-200" : ""}>
                        <td className="p-4 font-bold uppercase text-slate-600">{row.campName}</td>
                        <td className="p-4 font-black uppercase">{row.fullName}</td>
                        <td className="p-4">
                          {row.status === "Present" ? (
                            <span className="inline-block border-2 border-black bg-[#4ADE80] px-2 py-1 text-xs font-black uppercase">Present</span>
                          ) : (
                            <span className="inline-block border-2 border-black bg-slate-200 px-2 py-1 text-xs font-black uppercase text-slate-500">Absent</span>
                          )}
                        </td>
                        <td className="p-4 font-medium">
                          {row.timeIn ? new Date(row.timeIn).toLocaleTimeString() : "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}