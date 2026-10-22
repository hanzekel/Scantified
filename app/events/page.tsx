"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Sparkles, BarChart2, Plus, Clock, Heart } from "lucide-react";
import { generateSessionsFromSchedule, DayName, GeneratedSessionDraft } from "@/lib/scheduling";
import { useToast } from "@/components/ui/toast";

type EventItem = {
  id: number;
  title: string;
  description?: string;
  eventType: "MULTI_DAY" | "RECURRING";
  createdAt: string;
  schedule?: {
    ruleType: "DATE_RANGE" | "WEEKLY_DAYS";
    startDate: string;
    endDate: string;
    daysOfWeek?: string;
    startTime?: string;
    endTime?: string;
  };
  _count?: {
    sessions: number;
  };
};

const ALL_DAYS: { key: DayName; label: string; short: string }[] = [
  { key: "SUNDAY", label: "Sunday", short: "Sun" },
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
];

export default function EventsPage() {
  const toast = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"MULTI_DAY" | "RECURRING">("RECURRING");
  const [sessionType, setSessionType] = useState("Service");

  // Schedule Dates
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextMonth);
  const [selectedDays, setSelectedDays] = useState<DayName[]>(["FRIDAY", "SUNDAY"]);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load schedules");
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(day: DayName) {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  }

  // Compute live preview of materialized sessions
  let previewSessions: GeneratedSessionDraft[] = [];
  try {
    if (startDate && endDate) {
      previewSessions = generateSessionsFromSchedule(
        title || "Service",
        {
          ruleType: eventType === "MULTI_DAY" ? "DATE_RANGE" : "WEEKLY_DAYS",
          startDate,
          endDate,
          daysOfWeek: selectedDays,
        },
        sessionType
      );
    }
  } catch {
    previewSessions = [];
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a name for this schedule");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        eventType,
        sessionType,
        schedule: {
          ruleType: eventType === "MULTI_DAY" ? "DATE_RANGE" : "WEEKLY_DAYS",
          startDate,
          endDate,
          daysOfWeek: eventType === "RECURRING" ? selectedDays : undefined,
        },
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        toast.success(`Schedule created! Added ${previewSessions.length} session dates.`);
        fetchEvents();
      } else {
        const err = await res.json();
        toast.error(err.error || "Could not create schedule");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating schedule");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-5xl">
        
        {/* Header Bar */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-amber-200/60 bg-white/85 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-200/70 mb-2">
              <Calendar size={13} className="text-amber-600" />
              <span>Recurring Service Calendars</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Service Schedules
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Set up repeating weekly services or multi-day camps. The system creates the session dates automatically.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-2xl border border-amber-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
          >
            ← Back to Sessions
          </Link>
        </header>

        {/* Creator Card */}
        <div className="mb-10 rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-white/90 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Create a New Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Choose the dates and days of the week. All upcoming sessions will be set up automatically.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Schedule Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Worship Services, Summer Youth Camp"
                  required
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600 focus:shadow-md"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Activity Type</label>
                <input
                  type="text"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  placeholder="e.g. Service, Youth Group, Bible Study"
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600 focus:shadow-md"
                />
              </div>
            </div>

            {/* Schedule Pattern Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">How often does this meet?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEventType("RECURRING")}
                  className={`rounded-2xl p-3.5 text-center text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
                    eventType === "RECURRING"
                      ? "bg-slate-900 text-amber-300 shadow-md shadow-slate-900/15"
                      : "border border-amber-200/80 bg-white text-slate-700 hover:bg-amber-50/60"
                  }`}
                >
                  Weekly Repeating (e.g. Every Friday & Sunday)
                </button>
                <button
                  type="button"
                  onClick={() => setEventType("MULTI_DAY")}
                  className={`rounded-2xl p-3.5 text-center text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
                    eventType === "MULTI_DAY"
                      ? "bg-slate-900 text-amber-300 shadow-md shadow-slate-900/15"
                      : "border border-amber-200/80 bg-white text-slate-700 hover:bg-amber-50/60"
                  }`}
                >
                  Multi-Day Retreat (Consecutive Days)
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">First Day</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Last Day</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
                />
              </div>
            </div>

            {/* Day of Week Badges */}
            {eventType === "RECURRING" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Select Days of the Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleDay(day.key)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                          isSelected
                            ? "bg-amber-700 text-white shadow-sm"
                            : "border border-amber-200/80 bg-white text-slate-600 hover:bg-amber-50"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Schedule Live Preview Pill Box */}
            {previewSessions.length > 0 && (
              <div className="rounded-2xl border border-amber-200/80 bg-white/90 p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Preview: {previewSessions.length} session dates will be created
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                    Ready to Create
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                  {previewSessions.slice(0, 8).map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-amber-50/70 border border-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-950"
                    >
                      {s.title} ({new Date(s.date).toLocaleDateString()})
                    </span>
                  ))}
                  {previewSessions.length > 8 && (
                    <span className="self-center px-1 text-[11px] font-medium text-slate-400">
                      +{previewSessions.length - 8} more...
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || previewSessions.length === 0}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating..."
                : `Save Schedule & Create ${previewSessions.length} Dates`}
            </button>
          </form>
        </div>

        {/* Existing Events Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Your Schedules</h2>
            <span className="text-xs text-slate-500 font-medium">{events.length} schedules created</span>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-amber-200/60 bg-white/80 p-8 text-center text-xs font-medium text-slate-500">
              Loading schedules...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-amber-200 bg-white/70 p-10 text-center text-xs font-medium text-slate-500">
              No schedules created yet. Use the form above to add your first repeating service or retreat.
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="warm-card-interactive flex flex-col justify-between p-5 sm:p-6"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                        {event.eventType === "MULTI_DAY" ? "Multi-Day Camp" : "Weekly Schedule"}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {event._count?.sessions || 0} Sessions
                      </span>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-slate-900">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{event.description}</p>
                    )}

                    {event.schedule && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock size={13} className="text-amber-600" />
                        <span>
                          {new Date(event.schedule.startDate).toLocaleDateString()} —{" "}
                          {new Date(event.schedule.endDate).toLocaleDateString()}
                        </span>
                        {event.schedule.daysOfWeek && (
                          <span className="ml-1 rounded-md bg-amber-100/60 px-1.5 py-0.2 text-[10px] text-amber-900">
                            {event.schedule.daysOfWeek}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 pt-3 border-t border-amber-100">
                    <Link
                      href={`/events/${event.id}`}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-2 text-xs font-semibold text-white shadow-sm hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <span>View Dates</span>
                      <ArrowRight size={13} />
                    </Link>

                    <Link
                      href={`/events/${event.id}/analytics`}
                      className="flex items-center gap-1 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <BarChart2 size={14} />
                      <span>Leaderboard</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
