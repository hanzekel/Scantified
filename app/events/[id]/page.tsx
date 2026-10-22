"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit2, Ban, QrCode, Users, BarChart2, Check, X, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type CalendarStats = {
  total: number;
  scheduled: number;
  active: number;
  concluded: number;
  cancelled: number;
};

type SessionItem = {
  id: number;
  title: string;
  date: string;
  eventDay?: number;
  sessionType: string;
  status: "SCHEDULED" | "ACTIVE" | "CONCLUDED" | "CANCELLED";
  _count?: {
    records: number;
  };
};

type EventDetail = {
  id: number;
  title: string;
  description?: string;
  eventType: string;
  schedule?: {
    startDate: string;
    endDate: string;
    daysOfWeek?: string;
  };
  sessions: SessionItem[];
};

export default function EventCalendarPage() {
  const params = useParams();
  const eventId = params.id as string;
  const toast = useToast();

  const [data, setData] = useState<{ event: EventDetail; stats: CalendarStats } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (eventId) fetchCalendar();
  }, [eventId]);

  async function fetchCalendar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/calendar`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load session dates");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(sessionId: number, newStatus: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.info(newStatus === "CANCELLED" ? "Date cancelled" : `Updated status to ${newStatus}`);
        fetchCalendar();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  }

  async function handleSaveTitle(sessionId: number) {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      if (res.ok) {
        setEditingSessionId(null);
        toast.success("Name updated");
        fetchCalendar();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update name");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 md:p-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-amber-200/60 bg-white/90 p-12 text-center backdrop-blur-md">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-700">Loading planned dates...</p>
        </div>
      </main>
    );
  }

  if (!data?.event) {
    return (
      <main className="min-h-screen p-6 md:p-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-amber-200/60 bg-white/90 p-8 text-center backdrop-blur-md">
          <p className="text-sm font-semibold text-slate-800">
            Schedule not found.{" "}
            <Link href="/events" className="text-amber-800 underline">
              Back to Schedules
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const { event, stats } = data;

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-5xl">
        
        {/* Header Bar */}
        <header className="mb-8 rounded-3xl border border-amber-200/60 bg-white/85 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <Link
            href="/events"
            className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <ArrowLeft size={14} /> All Schedules
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {event.title}
              </h1>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {event.eventType === "MULTI_DAY" ? "Multi-Day Retreat" : "Weekly Schedule"}
                {event.schedule && ` • ${new Date(event.schedule.startDate).toLocaleDateString()} through ${new Date(event.schedule.endDate).toLocaleDateString()}`}
              </p>
            </div>

            <Link
              href={`/events/${eventId}/analytics`}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <BarChart2 size={16} />
              <span>Attendance Leaderboard 📊</span>
            </Link>
          </div>
        </header>

        {/* Stats Strip */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-amber-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Dates Planned
            </span>
            <span className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</span>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
              Upcoming
            </span>
            <span className="mt-1 text-2xl font-bold text-amber-800">{stats.scheduled}</span>
          </div>

          <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-indigo-800 uppercase tracking-wider">
              Open Now
            </span>
            <span className="mt-1 text-2xl font-bold text-indigo-800">{stats.active}</span>
          </div>

          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-rose-800 uppercase tracking-wider">
              Cancelled (Holidays)
            </span>
            <span className="mt-1 text-2xl font-bold text-rose-800">{stats.cancelled}</span>
          </div>
        </div>

        {/* Session Calendar List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Planned Dates
              </h2>
              <p className="text-xs text-slate-500">Open attendance on the day of the service, or cancel for weather and holidays.</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{event.sessions.length} dates</span>
          </div>

          <div className="divide-y divide-amber-100 rounded-3xl border border-amber-200/60 bg-white/90 shadow-sm overflow-hidden backdrop-blur-sm">
            {event.sessions.map((session) => {
              const sessionDate = new Date(session.date);
              const isCancelled = session.status === "CANCELLED";
              const isEditing = editingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={`flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center transition-colors ${
                    isCancelled ? "bg-slate-50/50 opacity-60" : "hover:bg-amber-50/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 font-semibold text-xs border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-800">
                        {sessionDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-base font-extrabold -mt-0.5">{sessionDate.getDate()}</span>
                    </div>

                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="rounded-xl border border-amber-300 px-2.5 py-1 text-xs font-semibold text-slate-900 outline-none focus:border-amber-600"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTitle(session.id)}
                            className="rounded-lg bg-amber-700 p-1 text-white hover:bg-amber-800 active:scale-95"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSessionId(null)}
                            className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-100 active:scale-95"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-base font-bold tracking-tight ${
                              isCancelled ? "line-through text-slate-400" : "text-slate-900"
                            }`}
                          >
                            {session.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSessionId(session.id);
                              setEditTitle(session.title);
                            }}
                            className="text-slate-400 hover:text-slate-700 hover:scale-110 active:scale-95 transition-all"
                            title="Rename this date"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}

                      <div className="mt-1 flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                        <span>{session.sessionType}</span>
                        <span>•</span>
                        <span>{session._count?.records || 0} Attended</span>
                        <span>•</span>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                            session.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : session.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : session.status === "CONCLUDED"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {session.status === "ACTIVE" ? "Open Now" : session.status === "CONCLUDED" ? "Completed" : session.status === "CANCELLED" ? "Holiday/Cancelled" : "Upcoming"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {session.status !== "CANCELLED" ? (
                      <>
                        <Link
                          href={`/sessions/${session.id}/present`}
                          target="_blank"
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                          <QrCode size={13} />
                          <span>Projector ↗</span>
                        </Link>

                        <Link
                          href={`/sessions/${session.id}/dashboard`}
                          className="flex items-center gap-1 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                          <Users size={13} />
                          <span>Roster</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(
                              session.id,
                              session.status === "ACTIVE" ? "CONCLUDED" : "ACTIVE"
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                          {session.status === "ACTIVE" ? "Close Attendance" : "Open Attendance"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(session.id, "CANCELLED")}
                          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:-translate-y-0.5 active:scale-95 transition-all"
                          title="Skip this date for holiday or bad weather"
                        >
                          <Ban size={12} />
                          <span>Cancel Date</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(session.id, "SCHEDULED")}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition-all"
                      >
                        <RotateCcw size={13} />
                        <span>Restore Date</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
