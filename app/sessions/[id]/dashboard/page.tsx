"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  QrCode,
  ArrowLeft,
  Lock,
  Unlock,
  UserCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  XCircle,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type MemberRecord = {
  id: number;
  fullName: string;
  role: string;
  campName: string;
  phoneNumber?: string;
  status: "PRESENT" | "EXCUSED" | "ABSENT";
  source?: string | null;
  notes?: string | null;
  timeIn?: string | null;
  recordId?: number | null;
};

type SessionStats = {
  totalRoster: number;
  present: number;
  excused: number;
  absent: number;
  attendanceRate: number;
};

type DashboardData = {
  session: {
    id: number;
    title: string;
    status: "SCHEDULED" | "ACTIVE" | "CONCLUDED" | "CANCELLED";
    sessionType: string;
    date: string;
    eventTitle: string;
  };
  stats: SessionStats;
  roster: MemberRecord[];
};

export default function CoordinatorLiveDashboard() {
  const params = useParams();
  const sessionId = params.id as string;
  const toast = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PRESENT" | "EXCUSED" | "ABSENT">("ALL");
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  // Excuse Modal State
  const [excuseModalMember, setExcuseModalMember] = useState<MemberRecord | null>(null);
  const [excusePreset, setExcusePreset] = useState("Sick");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    fetchDashboard(true);
    const interval = setInterval(() => {
      fetchDashboard(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  async function fetchDashboard(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/records`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function handleToggleStatus(memberId: number, status: "PRESENT" | "EXCUSED" | "ABSENT", notes?: string) {
    setIsUpdating(memberId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/records`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, status, notes }),
      });
      if (res.ok) {
        setExcuseModalMember(null);
        toast.success(status === "PRESENT" ? "Marked as present" : status === "EXCUSED" ? "Marked as excused" : "Reset to absent");
        fetchDashboard(false);
      } else {
        toast.error("Could not update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error updating status");
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleUpdateSessionStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.info(newStatus === "ACTIVE" ? "Attendance reopened" : "Attendance closed");
        fetchDashboard(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
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
      <main className="min-h-screen p-6 md:p-12 font-sans">
        <div className="mx-auto max-w-5xl rounded-3xl border border-amber-200/60 bg-white/90 p-12 text-center shadow-sm backdrop-blur-md">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-base text-slate-700 font-semibold">Loading attendee list...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen p-6 md:p-12 font-sans">
        <div className="mx-auto max-w-5xl rounded-3xl border border-amber-200/60 bg-white/90 p-8 text-center shadow-sm backdrop-blur-md">
          <p className="text-base text-slate-800 font-semibold">
            Session not found.{" "}
            <Link href="/" className="text-amber-700 underline underline-offset-2">
              Back to Sessions
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const { session, stats, roster } = data;

  const filteredRoster = roster.filter((m) => {
    const matchesQuery =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.campName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (activeTab === "ALL") return true;
    return m.status === activeTab;
  });

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-5xl">
        
        {/* Header Bar */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200/60 bg-white/85 p-6 shadow-sm backdrop-blur-md">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-xl border border-amber-200/80 bg-amber-50/50 px-2.5 py-1 text-xs font-semibold text-amber-950 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <ArrowLeft size={13} /> Back to Sessions
              </Link>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                {session.eventTitle}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {session.title} Attendee List
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {new Date(session.date).toLocaleDateString()} • {session.sessionType} • Live Check-In
            </p>
          </div>

          {/* Action Bar with Apple-style Lift */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/sessions/${session.id}/present`}
              target="_blank"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <QrCode size={16} />
              <span>Open Projector QR ↗</span>
            </Link>

            {session.status === "ACTIVE" ? (
              <button
                onClick={() => handleUpdateSessionStatus("CONCLUDED")}
                className="flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <Lock size={14} /> Close Check-In
              </button>
            ) : (
              <button
                onClick={() => handleUpdateSessionStatus("ACTIVE")}
                className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <Unlock size={14} /> Reopen Check-In
              </button>
            )}
          </div>
        </header>

        {/* Real-Time Live Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-amber-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Expected
            </span>
            <span className="mt-1 text-2xl font-bold text-slate-900">{stats.totalRoster}</span>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
              Checked In (P)
            </span>
            <span className="mt-1 text-2xl font-bold text-emerald-800">{stats.present}</span>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
              Excused (E)
            </span>
            <span className="mt-1 text-2xl font-bold text-amber-800">{stats.excused}</span>
          </div>

          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 shadow-sm">
            <span className="block text-[10px] font-semibold text-rose-800 uppercase tracking-wider">
              Not Checked In (A)
            </span>
            <span className="mt-1 text-2xl font-bold text-rose-800">{stats.absent}</span>
          </div>

          <div className="col-span-2 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500 to-amber-700 p-4 shadow-md shadow-amber-700/15 text-white md:col-span-1">
            <span className="block text-[10px] font-semibold text-amber-100 uppercase tracking-wider">
              Attendance %
            </span>
            <span className="mt-1 text-2xl font-bold text-white">{stats.attendanceRate}%</span>
          </div>
        </div>

        {/* Search & Tabs Controls with iOS-style Pills */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-amber-300 shadow-md shadow-slate-900/15"
                  : "border border-amber-200/60 bg-white/80 text-slate-600 hover:bg-amber-50/60"
              }`}
            >
              All ({stats.totalRoster})
            </button>
            <button
              onClick={() => setActiveTab("PRESENT")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                activeTab === "PRESENT"
                  ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                  : "border border-amber-200/60 bg-white/80 text-slate-600 hover:bg-emerald-50/60"
              }`}
            >
              Checked In ({stats.present})
            </button>
            <button
              onClick={() => setActiveTab("EXCUSED")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                activeTab === "EXCUSED"
                  ? "bg-amber-700 text-white shadow-md shadow-amber-700/20"
                  : "border border-amber-200/60 bg-white/80 text-slate-600 hover:bg-amber-50/60"
              }`}
            >
              Excused ({stats.excused})
            </button>
            <button
              onClick={() => setActiveTab("ABSENT")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                activeTab === "ABSENT"
                  ? "bg-rose-700 text-white shadow-md shadow-rose-700/20"
                  : "border border-amber-200/60 bg-white/80 text-slate-600 hover:bg-rose-50/60"
              }`}
            >
              Absent ({stats.absent})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search person or camp..."
              className="w-full rounded-2xl border border-amber-200/80 bg-white/90 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 transition-all focus:border-amber-600 shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Member List as iOS Contact Cards */}
        {filteredRoster.length === 0 ? (
          <div className="rounded-3xl border border-amber-200/60 bg-white/90 p-8 text-center text-xs font-medium text-slate-500 shadow-sm">
            No people found matching this search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRoster.map((member) => {
              const isBusy = isUpdating === member.id;

              return (
                <div
                  key={member.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 ${
                    member.status === "PRESENT"
                      ? "border-emerald-300/80 bg-emerald-50/20"
                      : member.status === "EXCUSED"
                      ? "border-amber-300/80 bg-amber-50/25"
                      : "border-amber-200/70 bg-white/95"
                  }`}
                >
                  <div>
                    {/* Contact Header: Avatar + Name + Status */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100/70 text-xs font-bold text-amber-900 border border-amber-200/70 shadow-inner">
                        {getInitials(member.fullName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {member.fullName}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${
                              member.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : member.status === "EXCUSED"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {member.status === "PRESENT" ? "Present" : member.status === "EXCUSED" ? "Excused" : "Absent"}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <span className="truncate">{member.campName}</span>
                          {member.role === "Guest" && (
                            <span className="rounded-full bg-amber-100/80 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                              Guest
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Subline */}
                    <div className="mt-2 text-[11px] text-slate-500 min-h-[1.25rem]">
                      {member.timeIn ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock size={11} className="text-emerald-600" />
                          <span>
                            Arrived{" "}
                            {new Date(member.timeIn).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      ) : member.notes ? (
                        <span className="italic text-amber-800">
                          Reason: {member.notes}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not checked in</span>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap iOS Segmented Status Pill */}
                  <div className="mt-3.5 flex items-center gap-1 rounded-xl border border-amber-200/70 bg-[#FAF8F5] p-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(member.id, "PRESENT")}
                      disabled={isBusy}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                        member.status === "PRESENT"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setExcuseModalMember(member);
                        setExcusePreset("Sick");
                        setCustomReason("");
                      }}
                      disabled={isBusy}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                        member.status === "EXCUSED"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-amber-800 hover:bg-amber-50"
                      }`}
                    >
                      Excuse
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(member.id, "ABSENT")}
                      disabled={isBusy}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                        member.status === "ABSENT"
                          ? "bg-slate-200 text-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Excuse Reason Dialog */}
        <Dialog
          isOpen={!!excuseModalMember}
          onClose={() => setExcuseModalMember(null)}
          title="Excuse This Absence"
          description={
            excuseModalMember
              ? `Excusing ${excuseModalMember.fullName}'s absence means this missed service won't lower their attendance percentage.`
              : ""
          }
        >
          <div className="space-y-4 pt-1 font-sans">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Choose a Reason
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Sick", "Family", "Work", "Out of Town"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setExcusePreset(preset);
                      setCustomReason("");
                    }}
                    className={`rounded-xl p-2.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${
                      excusePreset === preset && !customReason
                        ? "bg-amber-700 text-white shadow-sm"
                        : "border border-amber-200 bg-amber-50/50 text-slate-700 hover:bg-amber-100/60"
                    }`}
                  >
                    {preset === "Sick" ? "Sick / Unwell" : preset === "Family" ? "Family Emergency" : preset === "Work" ? "Work / School" : "Out of Town"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Or Type a Specific Note <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Sent prior text message..."
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 transition-all focus:border-amber-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExcuseModalMember(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (excuseModalMember) {
                    handleToggleStatus(
                      excuseModalMember.id,
                      "EXCUSED",
                      customReason.trim() || excusePreset
                    );
                  }
                }}
                className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-800 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Confirm Excused
              </button>
            </div>
          </div>
        </Dialog>

      </div>
    </main>
  );
}
