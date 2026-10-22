"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  AlertTriangle,
  UserX,
  Flame,
  ArrowLeft,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { EventAnalyticsResult } from "@/lib/analytics";

interface FullAnalyticsData extends EventAnalyticsResult {
  event: {
    id: number;
    title: string;
    description?: string;
    eventType: string;
    campName: string;
  };
}

export default function EventAnalyticsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [data, setData] = useState<FullAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"TIERS" | "MATRIX">("TIERS");
  const [tierSubTab, setTierSubTab] = useState<"MOST_PRESENT" | "AT_RISK" | "NO_ATTENDANCE">("MOST_PRESENT");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (eventId) fetchAnalytics();
  }, [eventId]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/analytics`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name: string) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (name[0] || "?").toUpperCase();
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 md:p-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-amber-200/60 bg-white/90 p-12 text-center backdrop-blur-md">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-700">Calculating attendance leaderboard...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen p-6 md:p-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-amber-200/60 bg-white/90 p-8 text-center backdrop-blur-md">
          <p className="text-sm font-semibold text-slate-800">
            Analytics not found.{" "}
            <Link href="/events" className="text-amber-800 underline">
              Back to Schedules
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const { event, summary, tiers, sessions, allMembers } = data;

  const filteredActiveList =
    tierSubTab === "MOST_PRESENT"
      ? tiers.mostPresent
      : tierSubTab === "AT_RISK"
      ? tiers.atRisk
      : tiers.noAttendance;

  const displayedMembers = filteredActiveList.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.campName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMatrixMembers = allMembers.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.campName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Bar */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200/60 bg-white/85 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href={`/events/${eventId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <ArrowLeft size={13} /> Planned Dates
              </Link>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                {event.campName}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {event.title} Attendance Summary
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              See who attended most faithfully, who has active streaks, and who might need a pastoral follow-up.
            </p>
          </div>

          {/* 1-Click Excel Matrix Download */}
          <a
            href={`/api/events/${eventId}/export`}
            download
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-xs font-semibold text-white shadow-md shadow-emerald-700/20 hover:from-emerald-700 hover:to-emerald-800 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Download Excel Sheet (.xlsx)</span>
          </a>
        </header>

        {/* Top Metric Cards Strip with User-Friendly Names */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-amber-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Services Held
            </span>
            <span className="mt-1 text-2xl font-bold text-slate-900">{summary.elapsedSessions}</span>
          </div>

          <div className="rounded-2xl border border-amber-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              People Enrolled
            </span>
            <span className="mt-1 text-2xl font-bold text-slate-900">{summary.totalMembers}</span>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
              Avg Attendance
            </span>
            <span className="mt-1 text-2xl font-bold text-amber-800">{summary.averageAttendanceRate}%</span>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
              Perfect 100%
            </span>
            <span className="mt-1 text-2xl font-bold text-emerald-800">{summary.perfectAttendanceCount}</span>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
              Needs Follow-Up
            </span>
            <span className="mt-1 text-2xl font-bold text-amber-800">{summary.atRiskCount}</span>
          </div>

          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-rose-800 uppercase tracking-wider">
              Not Attended Yet
            </span>
            <span className="mt-1 text-2xl font-bold text-rose-800">{summary.noAttendanceCount}</span>
          </div>
        </div>

        {/* View Switcher Tabs & Search Filter */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("TIERS")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                activeTab === "TIERS"
                  ? "bg-slate-900 text-amber-300 shadow-md shadow-slate-900/15"
                  : "border border-amber-200/80 bg-white text-slate-600 hover:bg-amber-50"
              }`}
            >
              Leaderboards & Follow-Up
            </button>

            <button
              onClick={() => setActiveTab("MATRIX")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                activeTab === "MATRIX"
                  ? "bg-slate-900 text-amber-300 shadow-md shadow-slate-900/15"
                  : "border border-amber-200/80 bg-white text-slate-600 hover:bg-amber-50"
              }`}
            >
              Full Attendance Grid
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search person or group..."
              className="w-full rounded-2xl border border-amber-200/80 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 transition-all focus:border-amber-600 shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* TAB 1: LEADERBOARDS & TIERS */}
        {activeTab === "TIERS" && (
          <div>
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setTierSubTab("MOST_PRESENT")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                  tierSubTab === "MOST_PRESENT"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "border border-amber-200/80 bg-white text-slate-600 hover:bg-emerald-50/60"
                }`}
              >
                <Trophy size={14} />
                <span>Most Faithful ({tiers.mostPresent.length})</span>
              </button>

              <button
                onClick={() => setTierSubTab("AT_RISK")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                  tierSubTab === "AT_RISK"
                    ? "bg-amber-700 text-white shadow-sm"
                    : "border border-amber-200/80 bg-white text-slate-600 hover:bg-amber-50/60"
                }`}
              >
                <HeartHandshake size={14} />
                <span>Needs Follow-Up / Missed Recent ({tiers.atRisk.length})</span>
              </button>

              <button
                onClick={() => setTierSubTab("NO_ATTENDANCE")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                  tierSubTab === "NO_ATTENDANCE"
                    ? "bg-rose-700 text-white shadow-sm"
                    : "border border-amber-200/80 bg-white text-slate-600 hover:bg-rose-50/60"
                }`}
              >
                <UserX size={14} />
                <span>Haven&apos;t Attended Yet ({tiers.noAttendance.length})</span>
              </button>
            </div>

            {/* Tier Member Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {displayedMembers.length === 0 ? (
                <div className="col-span-2 rounded-3xl border border-dashed border-amber-200 bg-white/70 p-10 text-center text-xs font-medium text-slate-500">
                  No people found in this category.
                </div>
              ) : (
                displayedMembers.map((member, index) => (
                  <div
                    key={member.memberId}
                    className="warm-card flex flex-col justify-between p-5"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {tierSubTab === "MOST_PRESENT" && (
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                                index === 0
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : index === 1
                                  ? "bg-slate-200 text-slate-800"
                                  : index === 2
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              #{index + 1}
                            </span>
                          )}
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100/70 text-xs font-bold text-amber-900 border border-amber-200/60">
                            {getInitials(member.fullName)}
                          </div>
                          <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-900">
                              {member.fullName}
                            </h3>
                            <span className="block text-[11px] text-slate-500 font-medium">
                              {member.campName}
                            </span>
                          </div>
                        </div>

                        {member.currentStreak > 1 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                            <Flame size={13} className="text-amber-500 fill-amber-400" />
                            <span>{member.currentStreak} in a row</span>
                          </span>
                        )}
                      </div>

                      {/* Stat Metrics Strip */}
                      <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl border border-amber-100 bg-[#FAF7F2] p-2.5 text-center">
                        <div>
                          <span className="block text-[10px] font-medium text-slate-400 uppercase">Score</span>
                          <span className="text-sm font-bold text-slate-900">{member.rate}%</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-medium text-slate-400 uppercase">Present</span>
                          <span className="text-sm font-bold text-emerald-800">{member.attendedCount}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-medium text-slate-400 uppercase">Excused</span>
                          <span className="text-sm font-bold text-amber-800">{member.excusedCount}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-medium text-slate-400 uppercase">Streak</span>
                          <span className="text-sm font-bold text-amber-700">{member.currentStreak}</span>
                        </div>
                      </div>
                    </div>

                    {/* Historical Session Status Badges */}
                    <div className="mt-4 border-t border-amber-100 pt-3">
                      <span className="mb-1.5 block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Recent Services:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sessions.map((s) => {
                          const status = member.sessionStatuses[s.id] || "A";
                          return (
                            <span
                              key={s.id}
                              title={`${s.title}: ${
                                status === "P" ? "Present" : status === "E" ? "Excused" : "Absent"
                              }`}
                              className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                                status === "P"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : status === "E"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {status}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE MATRIX GRID */}
        {activeTab === "MATRIX" && (
          <div className="overflow-x-auto rounded-3xl border border-amber-200/60 bg-white/90 shadow-sm backdrop-blur-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-amber-200/60 bg-amber-50/50">
                  <th className="sticky left-0 z-10 border-r border-amber-200/60 bg-amber-50/95 p-3.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Attendee Name
                  </th>
                  <th className="border-r border-amber-200/60 p-3.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Group / Camp
                  </th>
                  {sessions.map((s) => (
                    <th
                      key={s.id}
                      className="border-r border-amber-200/60 p-3 text-center font-bold text-slate-700 uppercase tracking-wider text-[11px] whitespace-nowrap"
                    >
                      {s.title}
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                        {new Date(s.date).toLocaleDateString()}
                      </span>
                    </th>
                  ))}
                  <th className="border-r border-amber-200/60 bg-amber-100/60 p-3.5 text-center font-bold text-amber-950 uppercase tracking-wider text-[11px]">
                    Attendance %
                  </th>
                  <th className="p-3.5 text-center font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Services Attended
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium">
                {filteredMatrixMembers.map((member) => (
                  <tr key={member.memberId} className="hover:bg-amber-50/30 transition-colors">
                    <td className="sticky left-0 z-10 border-r border-amber-200/60 bg-white p-3 font-semibold text-slate-900">
                      {member.fullName}
                    </td>
                    <td className="border-r border-amber-200/60 p-3 text-slate-600">{member.campName}</td>
                    {sessions.map((s) => {
                      const status = member.sessionStatuses[s.id] || "A";
                      return (
                        <td key={s.id} className="border-r border-amber-200/60 p-2 text-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-bold text-[10px] ${
                              status === "P"
                                ? "bg-emerald-100 text-emerald-800"
                                : status === "E"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      );
                    })}
                    <td className="border-r border-amber-200/60 bg-amber-50/50 p-3 text-center font-bold text-amber-900">
                      {member.rate}%
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-800">
                      {member.attendedCount} / {member.applicableCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  );
}
