"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QrCode, Calendar, Sparkles, Users, Radio, Plus, ArrowUpRight, Heart } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type EventSession = {
  id: number;
  title: string;
  eventDay: number;
  sessionType: string;
  date: string;
  status?: string;
};

export default function Dashboard() {
  const toast = useToast();
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [title, setTitle] = useState("");
  const [eventDay, setEventDay] = useState("1");
  const [sessionType, setSessionType] = useState("Plenary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, eventDay: parseInt(eventDay), sessionType }),
      });
      if (res.ok) {
        setTitle("");
        toast.success("New session opened!");
        fetchSessions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Could not open session");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error opening session");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-5xl">
        
        {/* Welcome Header */}
        <header className="relative mb-8 overflow-hidden rounded-3xl border border-amber-200/60 bg-white/85 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-amber-300/25 via-amber-200/10 to-transparent blur-2xl" />

          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-900 border border-amber-200/70 mb-2.5">
                <Heart size={12} className="text-amber-600 fill-amber-500" />
                <span>Church & Community Attendance</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Sessions & Gatherings
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 font-medium max-w-xl">
                Start a service or activity. Attendees scan the on-screen QR code with their phone to check in automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/events"
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <Calendar size={15} />
                <span>Service Schedules</span>
                <ArrowUpRight size={14} />
              </Link>
              <Link
                href="/register"
                className="hidden rounded-2xl border border-amber-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:-translate-y-0.5 active:scale-95 transition-all sm:block shadow-sm"
              >
                Public Sign-Up Page ↗
              </Link>
            </div>
          </div>
        </header>

        {/* Start a Session Card */}
        <div className="mb-10 rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-white/90 p-6 sm:p-7 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800 border border-amber-200">
              <Plus size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Start a Session for Today
              </h2>
              <p className="text-xs text-slate-500">Quickly launch check-in for a service, prayer meeting, or youth activity</p>
            </div>
          </div>

          <form onSubmit={handleCreateSession} className="grid gap-4 md:grid-cols-4 md:items-end">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Service or Session Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunday Morning Service, Friday Youth Night"
                required
                className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600 focus:shadow-md"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Event Day</label>
              <select
                value={eventDay}
                onChange={(e) => setEventDay(e.target.value)}
                className="w-full rounded-2xl border border-amber-200/80 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
              >
                <option value="1">Day 1</option>
                <option value="2">Day 2</option>
                <option value="3">Day 3</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full rounded-2xl border border-amber-200/80 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
              >
                <option value="Plenary">Plenary Service</option>
                <option value="Camp Activity">Camp Activity</option>
                <option value="Mass">Mass</option>
                <option value="Worship">Worship</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Starting..." : "Open Attendance for this Session"}
              </button>
            </div>
          </form>
        </div>

        {/* Sessions List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Active Sessions
            </h2>
            <span className="text-xs font-medium text-slate-500">{sessions.length} sessions available</span>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-amber-200 bg-white/70 p-12 text-center text-xs font-medium text-slate-500">
              No sessions created yet. Start one above or set up a recurring schedule in{" "}
              <Link href="/events" className="font-semibold text-amber-800 underline">
                Schedules
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="warm-card-interactive flex flex-col justify-between p-5 sm:p-6"
                >
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                        Day {session.eventDay || 1}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {session.sessionType}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Date: {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 pt-3 border-t border-amber-100">
                    <Link
                      href={`/sessions/${session.id}/present`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
                      <QrCode size={16} />
                      <span>Display Projector Screen ↗</span>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/sessions/${session.id}/dashboard`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/50 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
                      >
                        <Users size={14} />
                        <span>View Attendee List</span>
                      </Link>

                      <Link
                        href={`/scanner?sessionId=${session.id}`}
                        className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition-all"
                      >
                        Camera Scanner
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
