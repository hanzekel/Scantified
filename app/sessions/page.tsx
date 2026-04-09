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
    <main className="app-shell">
      <AppNavbar />

      <section className="section-container relative z-10 py-10 text-white">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
              Ministry QR Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Attendance Sessions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Create and manage attendance sessions for choir and altar servers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="secondary-button">
              ← Back
            </Link>

            <Link href="/" className="primary-button">
              Exit to Home
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="glass-card rounded-[28px] p-6">
            <div className="mb-5">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                Create Session
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">
                New attendance setup
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Create a session before scanning QR codes so records are grouped
                by date, type, and ministry.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="Example: Sunday Choir Attendance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white placeholder:text-white/60"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Attendance Type
                </label>
                <select
                  value={attendanceType}
                  onChange={(e) => setAttendanceType(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
                >
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
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Ministry
                </label>
                <select
                  value={ministry}
                  onChange={(e) => setMinistry(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
                >
                  <option value="Choir" className="text-black">
                    Choir
                  </option>
                  <option value="Altar Server" className="text-black">
                    Altar Server
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Session"}
              </button>
            </form>
          </section>

          <section className="glass-card rounded-[28px] p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                  Recent Sessions
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  Session History
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Open a scanner directly from any session below.
                </p>
              </div>

              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                Total Sessions: {sessions.length}
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="rounded-3xl border border-white/15 bg-white/10 p-10 text-center">
                <p className="text-lg font-semibold text-white">
                  No sessions yet
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Create your first attendance session on the left.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-sm backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                          {session.attendanceType}
                        </p>
                        <h3 className="mt-2 text-lg font-extrabold text-white">
                          {session.title}
                        </h3>
                      </div>

                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
                        {session.ministry}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-white/80">
                      <p>
                        <span className="font-semibold text-white">Date:</span>{" "}
                        {new Date(session.attendanceDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Session ID:
                        </span>{" "}
                        {session.id}
                      </p>
                    </div>

<div className="mt-5 flex flex-wrap gap-3">
  <Link
    href={`/scanner?sessionId=${session.id}`}
    className="primary-button"
  >
    Open Scanner
  </Link>

  <Link href="/members" className="secondary-button">
    View Members
  </Link>

  <button
    onClick={() => handleDeleteSession(session.id)}
    type="button"
    className="rounded-full border border-red-300/30 bg-red-500/15 px-4 py-3 font-semibold text-white backdrop-blur-md hover:bg-red-500/25"
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