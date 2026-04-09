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
    <main className="app-shell">
      <AppNavbar />

      <section className="section-container relative z-10 py-10 text-white">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
              Ministry QR Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Attendance Records
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              View and filter attendance logs from your ministry sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sessions" className="secondary-button">
              ← Back
            </Link>

            <Link href="/" className="primary-button">
              Exit to Home
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-[28px] p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                Records Overview
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">
                Attendance Log History
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Filter attendance records by ministry, attendance type, and date.
              </p>
            </div>

            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
              Total Records: {records.length}
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <select
              value={ministry}
              onChange={(e) => setMinistry(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
            >
              <option value="" className="text-black">
                All Ministries
              </option>
              <option value="Choir" className="text-black">
                Choir
              </option>
              <option value="Altar Server" className="text-black">
                Altar Server
              </option>
            </select>

            <select
              value={attendanceType}
              onChange={(e) => setAttendanceType(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
            >
              <option value="" className="text-black">
                All Types
              </option>
              <option value="Sunday" className="text-black">
                Sunday
              </option>
              <option value="Friday" className="text-black">
                Friday
              </option>
              <option value="Practice" className="text-black">
                Practice
              </option>
              <option value="Special Event" className="text-black">
                Special Event
              </option>
            </select>

            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
            />

            <button onClick={fetchRecords} className="primary-button w-full">
              {loading ? "Loading..." : "Apply Filters"}
            </button>
          </div>

          {records.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-white/10 p-10 text-center">
              <p className="text-lg font-semibold text-white">
                No attendance records found
              </p>
              <p className="mt-2 text-sm text-white/75">
                Scan some members first or adjust your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-auto rounded-3xl border border-white/15 bg-white/10">
              <table className="min-w-full border-collapse text-left text-white">
                <thead className="bg-white/10">
                  <tr>
                    <th className="p-4">Member</th>
                    <th className="p-4">Ministry</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Session</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Time In</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-t border-white/10">
                      <td className="p-4 font-semibold">{record.member.fullName}</td>
                      <td className="p-4">{record.member.ministry}</td>
                      <td className="p-4">{record.member.role}</td>
                      <td className="p-4">{record.session.title}</td>
                      <td className="p-4">{record.session.attendanceType}</td>
                      <td className="p-4">
                        {new Date(record.session.attendanceDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold backdrop-blur-md ${
                            record.status === "Present"
                              ? "border border-emerald-300/25 bg-emerald-400/15 text-white"
                              : "border border-red-300/25 bg-red-400/15 text-white"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {record.timeIn
                          ? new Date(record.timeIn).toLocaleTimeString()
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