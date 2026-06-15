"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppNavbar from "@/components/app-navbar";
import PageTransition from "@/components/page-transition";

type Session = {
  id: number;
  title: string;
  attendanceDate: string;
  attendanceType: string;
  ministry: string;
};

export default function SessionsPage() {
  const [title, setTitle] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceType, setAttendanceType] = useState("Sunday");
  const [ministry, setMinistry] = useState("Choir");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();

      if (!res.ok) {
        console.error("Fetch sessions failed:", data);
        return;
      }

      setSessions(data);
    } catch (error) {
      console.error("fetchSessions error:", error);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          attendanceDate,
          attendanceType,
          ministry,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create session");
        setLoading(false);
        return;
      }

      setTitle("");
      setAttendanceDate("");
      setAttendanceType("Sunday");
      setMinistry("Choir");
      await fetchSessions();
      alert("Session created successfully");
    } catch (error) {
      console.error("handleSubmit error:", error);
      alert("Something went wrong while creating the session");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSession(sessionId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this session? This will also delete all attendance records inside it."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete session");
        return;
      }

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      alert("Session deleted successfully");
    } catch (error) {
      console.error("handleDeleteSession error:", error);
      alert("Something went wrong while deleting the session");
    }
  }

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
              Attendance Sessions
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Create and manage attendance sessions for choir and altar servers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
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

        <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
          
          {/* Left Column: Create Session Form */}
          <section className="h-fit border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-6 border-b-2 border-black pb-4">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Create Session
              </p>
              <h2 className="mt-1 text-2xl font-black text-black">
                New attendance setup
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                Create a session before scanning QR codes so records are grouped
                by date, type, and ministry.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="Example: Sunday Choir Attendance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-black bg-white p-3.5 text-black placeholder:text-slate-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full border-2 border-black bg-white p-3.5 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Attendance Type
                </label>
                <div className="relative">
                  <select
                    value={attendanceType}
                    onChange={(e) => setAttendanceType(e.target.value)}
                    className="w-full appearance-none border-2 border-black bg-white p-3.5 pr-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Friday">Friday</option>
                    <option value="Practice">Practice</option>
                    <option value="Special Event">Special Event</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l-2 border-black bg-slate-100 px-4 text-black">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Ministry
                </label>
                <div className="relative">
                  <select
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value)}
                    className="w-full appearance-none border-2 border-black bg-white p-3.5 pr-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="Choir">Choir</option>
                    <option value="Altar Server">Altar Server</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l-2 border-black bg-slate-100 px-4 text-black">
                    ▼
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full border-2 border-black bg-[#E5FF2A] px-6 py-3.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Session"}
              </button>
            </form>
          </section>

          {/* Right Column: Session History List */}
          <section className="flex h-full flex-col border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-6 flex flex-col gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                  Recent Sessions
                </p>
                <h2 className="mt-1 text-2xl font-black text-black">
                  Session History
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  Open a scanner directly from any session below.
                </p>
              </div>

              <div className="flex h-fit items-center whitespace-nowrap border-2 border-black bg-[#E5FF2A] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Total Sessions: {sessions.length}
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-black bg-slate-50 p-12 text-center shadow-inner">
                <p className="text-xl font-black text-black">No sessions yet</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Create your first attendance session on the left.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col justify-between border-2 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-[#6345ED]">
                            {session.attendanceType}
                          </p>
                          <h3 className="mt-1 text-lg font-black leading-tight text-black">
                            {session.title}
                          </h3>
                        </div>

                        <span className="shrink-0 border-2 border-black bg-slate-100 px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {session.ministry}
                        </span>
                      </div>

                      <div className="mt-5 space-y-1.5 border-l-2 border-[#E5FF2A] pl-3 text-sm font-medium text-slate-600">
                        <p>
                          <span className="font-bold text-black">Date:</span>{" "}
                          {new Date(session.attendanceDate).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-bold text-black">
                            Session ID:
                          </span>{" "}
                          {session.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t-2 border-slate-100 pt-4">
                      <Link
                        href={`/scanner?sessionId=${session.id}`}
                        className="flex-1 border-2 border-black bg-[#E5FF2A] px-3 py-2 text-center text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        Scanner
                      </Link>

                      <Link
                        href="/members"
                        className="flex-1 border-2 border-black bg-white px-3 py-2 text-center text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        Members
                      </Link>

                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        type="button"
                        className="border-2 border-black bg-[#FF4A4A] px-3 py-2 text-xs font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}