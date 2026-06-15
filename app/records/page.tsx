"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppNavbar from "@/components/app-navbar";
import PageTransition from "@/components/page-transition";

type AttendanceRecord = {
  id: number;
  status: string;
  timeIn: string | null;
  member: {
    fullName: string;
    ministry: string;
    role: string;
  };
  session: {
    title: string;
    attendanceType: string;
    attendanceDate: string;
    ministry: string;
  };
};

export default function RecordsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [ministry, setMinistry] = useState("");
  const [attendanceType, setAttendanceType] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchRecords() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (ministry) params.append("ministry", ministry);
      if (attendanceType) params.append("attendanceType", attendanceType);
      if (attendanceDate) params.append("attendanceDate", attendanceDate);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data.error || "Failed to fetch records");
        setLoading(false);
        return;
      }

      setRecords(data);
    } catch (error) {
      console.error("fetchRecords error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecords();
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
              Attendance Records
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              View and filter attendance logs from your ministry sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/sessions"
              className="border-2 border-black bg-white px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              ← Back
            </Link>

            <Link
              href="/"
              className="border-2 border-black bg-[#E5FF2A] px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Exit to Home
            </Link>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-6 flex flex-col gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Records Overview
              </p>
              <h2 className="mt-1 text-2xl font-black text-black">
                Attendance Log History
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                Filter attendance records by ministry, attendance type, and date.
              </p>
            </div>

            <div className="flex h-fit items-center whitespace-nowrap border-2 border-black bg-[#E5FF2A] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Total Records: {records.length}
            </div>
          </div>

          {/* Filters Grid */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            
            {/* Ministry Filter */}
            <div className="relative">
              <select
                value={ministry}
                onChange={(e) => setMinistry(e.target.value)}
                className="w-full appearance-none border-2 border-black bg-white p-3.5 pr-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <option value="">All Ministries</option>
                <option value="Choir">Choir</option>
                <option value="Altar Server">Altar Server</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l-2 border-black bg-slate-100 px-4 text-black">
                ▼
              </div>
            </div>

            {/* Attendance Type Filter */}
            <div className="relative">
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value)}
                className="w-full appearance-none border-2 border-black bg-white p-3.5 pr-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <option value="">All Types</option>
                <option value="Sunday">Sunday</option>
                <option value="Friday">Friday</option>
                <option value="Practice">Practice</option>
                <option value="Special Event">Special Event</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l-2 border-black bg-slate-100 px-4 text-black">
                ▼
              </div>
            </div>

            {/* Date Filter */}
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full border-2 border-black bg-white p-3.5 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            />

            {/* Apply Button */}
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="w-full border-2 border-black bg-[#E5FF2A] p-3.5 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Apply Filters"}
            </button>
          </div>

          {/* Records Table */}
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-black bg-slate-50 p-12 text-center shadow-inner">
              <p className="text-xl font-black text-black">
                No attendance records found
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Scan some members first or adjust your filters above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="min-w-full border-collapse text-left text-black">
                <thead className="bg-slate-100 border-b-2 border-black">
                  <tr>
                    <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Member</th>
                    <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Ministry</th>
                    <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Role</th>
                    <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Session</th>
                    <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Type</th>
                    <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Date</th>
                    <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Status</th>
                    <th className="whitespace-nowrap p-4 font-black">Time In</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {records.map((record) => (
                    <tr key={record.id} className="border-b-2 border-black last:border-b-0 hover:bg-slate-50">
                      <td className="border-r-2 border-black p-4 font-bold">{record.member.fullName}</td>
                      <td className="border-r-2 border-black p-4 font-medium text-slate-700">{record.member.ministry}</td>
                      <td className="border-r-2 border-black p-4 text-sm font-medium text-slate-600">{record.member.role}</td>
                      <td className="border-r-2 border-black p-4 font-bold">{record.session.title}</td>
                      <td className="border-r-2 border-black p-4 text-sm font-medium text-slate-600">{record.session.attendanceType}</td>
                      <td className="border-r-2 border-black p-4 text-sm font-medium text-slate-600">
                        {new Date(record.session.attendanceDate).toLocaleDateString()}
                      </td>
                      <td className="border-r-2 border-black p-4">
                        <span
                          className={`inline-flex border-2 border-black px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            record.status === "Present"
                              ? "bg-[#4ADE80] text-black" // Emerald Green
                              : "bg-[#FF4A4A] text-white" // Red
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                        {record.timeIn
                          ? new Date(record.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}