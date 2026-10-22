// app/checkin/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  QrCode,
  Search,
  User,
  UserPlus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  WifiOff,
  CloudUpload,
  Phone,
  ShieldCheck,
  ChevronRight,
  Heart,
} from "lucide-react";
import { enqueueOfflineCheckIn, flushOfflineQueue, getOfflineQueue, startOfflineSyncManager } from "@/lib/offline-queue";
import { playCelebrationChime } from "@/components/ui/audio";
import { useToast } from "@/components/ui/toast";

type RosterMember = {
  id: number;
  fullName: string;
  role: string;
  campName: string;
  requiresPhoneVerification: boolean;
};

type PairedDevice = {
  memberId: number;
  fullName: string;
  pairingToken: string;
};

const PAIRING_KEY = "scantified_device_pairing";

function CheckInContent() {
  const searchParams = useSearchParams();
  const sessionIdStr = searchParams.get("sessionId");
  const token = searchParams.get("token") || "";
  const tsStr = searchParams.get("ts");
  const timeWindow = tsStr ? parseInt(tsStr, 10) : undefined;
  const sessionId = sessionIdStr ? parseInt(sessionIdStr, 10) : null;
  const toast = useToast();

  const [pairedDevice, setPairedDevice] = useState<PairedDevice | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [rosterResults, setRosterResults] = useState<RosterMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<RosterMember | null>(null);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNotes, setGuestNotes] = useState("");

  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    alreadyCheckedIn?: boolean;
    message: string;
    memberName?: string;
    campName?: string;
    sessionTitle?: string;
    isOffline?: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAIRING_KEY);
      if (stored) {
        setPairedDevice(JSON.parse(stored));
      }
      setPendingSyncCount(getOfflineQueue().length);
    } catch (e) {
      console.error("Failed to read pairing from localStorage", e);
    }

    // Start robust offline sync manager with exponential backoff
    const stopSyncManager = startOfflineSyncManager((synced) => {
      setPendingSyncCount(getOfflineQueue().length);
      toast.info(`Synced ${synced} offline check-in${synced > 1 ? "s" : ""}!`);
    });

    return () => {
      stopSyncManager();
    };
  }, [toast]);

  useEffect(() => {
    if (!sessionId || !searchQuery.trim() || selectedMember || isGuestMode) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/sessions/${sessionId}/roster?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          setRosterResults(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, sessionId, selectedMember, isGuestMode]);

  async function handleSubmitCheckIn(overrideMemberId?: number, overridePairingToken?: string) {
    if (!sessionId || !token) {
      setErrorMessage("Please scan the QR code on the church screen again.");
      return;
    }

    const memberIdToUse = overrideMemberId || pairedDevice?.memberId || selectedMember?.id;
    if (!memberIdToUse) {
      setErrorMessage("Please select your name first.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    interface CheckInPayload {
      sessionId: number;
      token: string;
      timeWindow?: number;
      memberId: number;
      pairingToken?: string;
      phoneNumberDigits?: string;
    }

    const payload: CheckInPayload = {
      sessionId,
      token,
      timeWindow,
      memberId: memberIdToUse,
    };

    if (overridePairingToken || pairedDevice?.pairingToken) {
      payload.pairingToken = overridePairingToken || pairedDevice?.pairingToken;
    } else if (phoneDigits) {
      payload.phoneNumberDigits = phoneDigits;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineCheckIn({
        type: "MEMBER",
        sessionId,
        token,
        timeWindow,
        memberId: memberIdToUse,
        pairingToken: payload.pairingToken,
        phoneNumberDigits: payload.phoneNumberDigits,
      });

      setPendingSyncCount(getOfflineQueue().length);
      setIsSubmitting(false);
      playCelebrationChime();
      setCheckInResult({
        success: true,
        isOffline: true,
        message: "Saved to your phone! Will automatically sync once you're back online.",
        memberName: pairedDevice?.fullName || selectedMember?.fullName,
        campName: "Offline Mode",
        sessionTitle: "Today's Service",
      });
      return;
    }

    try {
      const res = await fetch("/api/sessions/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        playCelebrationChime();
        setCheckInResult({
          success: true,
          alreadyCheckedIn: data.alreadyCheckedIn,
          message: data.message,
          memberName: data.member?.fullName,
          campName: data.member?.camp,
          sessionTitle: data.sessionTitle,
        });

        if (data.pairingToken) {
          const newPairing: PairedDevice = {
            memberId: data.member.id,
            fullName: data.member.fullName,
            pairingToken: data.pairingToken,
          };
          localStorage.setItem(PAIRING_KEY, JSON.stringify(newPairing));
          setPairedDevice(newPairing);
        }
      } else {
        setErrorMessage(data.error || "Check-in failed. Please try scanning again.");
      }
    } catch (err) {
      console.warn("Network error during check-in, queuing offline", err);
      enqueueOfflineCheckIn({
        type: "MEMBER",
        sessionId,
        token,
        timeWindow,
        memberId: memberIdToUse,
        pairingToken: payload.pairingToken,
        phoneNumberDigits: payload.phoneNumberDigits,
      });

      setPendingSyncCount(getOfflineQueue().length);
      playCelebrationChime();
      setCheckInResult({
        success: true,
        isOffline: true,
        message: "Saved to your phone! Will sync when connection returns.",
        memberName: pairedDevice?.fullName || selectedMember?.fullName,
        campName: "Offline Mode",
        sessionTitle: "Today's Service",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !token) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      setErrorMessage("Please enter both your name and phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineCheckIn({
        type: "GUEST",
        sessionId,
        token,
        timeWindow,
        fullName: guestName.trim(),
        phoneNumber: guestPhone.trim(),
        notes: guestNotes.trim(),
      });

      setPendingSyncCount(getOfflineQueue().length);
      setIsSubmitting(false);
      playCelebrationChime();
      setCheckInResult({
        success: true,
        isOffline: true,
        message: "Saved to phone! Will sync when online.",
        memberName: guestName,
        campName: "Guest Visitor",
        sessionTitle: "Today's Service",
      });
      return;
    }

    try {
      const res = await fetch("/api/sessions/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          token,
          timeWindow,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestNotes: guestNotes.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        playCelebrationChime();
        setCheckInResult({
          success: true,
          message: data.message,
          memberName: data.member?.fullName,
          campName: data.member?.camp,
          sessionTitle: data.sessionTitle,
        });

        if (data.pairingToken && data.member?.id) {
          const newPairing: PairedDevice = {
            memberId: data.member.id,
            fullName: data.member.fullName,
            pairingToken: data.pairingToken,
          };
          localStorage.setItem(PAIRING_KEY, JSON.stringify(newPairing));
          setPairedDevice(newPairing);
        }
      } else {
        setErrorMessage(data.error || "Could not complete guest registration.");
      }
    } catch (err) {
      console.warn("Guest network failed, queuing offline", err);
      enqueueOfflineCheckIn({
        type: "GUEST",
        sessionId,
        token,
        timeWindow,
        fullName: guestName.trim(),
        phoneNumber: guestPhone.trim(),
        notes: guestNotes.trim(),
      });

      setPendingSyncCount(getOfflineQueue().length);
      playCelebrationChime();
      setCheckInResult({
        success: true,
        isOffline: true,
        message: "Saved to phone! Will auto-sync when online.",
        memberName: guestName,
        campName: "Guest Visitor",
        sessionTitle: "Today's Service",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgetDevice() {
    localStorage.removeItem(PAIRING_KEY);
    setPairedDevice(null);
    setIsSwitchingUser(true);
    setSelectedMember(null);
    setSearchQuery("");
  }

  function getInitials(name: string) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (name[0] || "?").toUpperCase();
  }

  if (!sessionId || !token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-3xl border border-amber-200/60 bg-white/95 p-8 text-center shadow-xl backdrop-blur-md"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
            <QrCode className="h-8 w-8" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Scan Required</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed font-sans">
            Please point your phone camera at the QR code displayed on the church screen to check in.
          </p>
        </motion.div>
      </main>
    );
  }

  // Success / Checked In View
  if (checkInResult) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-sm rounded-3xl border border-amber-200/70 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-md overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-gradient-to-b from-amber-300/35 via-amber-200/15 to-transparent blur-2xl" />

          {/* Animated Celebration Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
            className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/70 border border-emerald-200"
          >
            <CheckCircle2 className="h-10 w-10" strokeWidth={2.4} />
          </motion.div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              checkInResult.isOffline
                ? "bg-amber-100 text-amber-800"
                : checkInResult.alreadyCheckedIn
                ? "bg-slate-100 text-slate-700"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            {checkInResult.isOffline ? (
              <>
                <WifiOff size={12} /> Saved Locally (Offline)
              </>
            ) : checkInResult.alreadyCheckedIn ? (
              "Already Checked In"
            ) : (
              <>
                <Sparkles size={12} className="text-amber-500" /> Attendance Confirmed
              </>
            )}
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {checkInResult.isOffline
              ? "Saved to Phone!"
              : checkInResult.alreadyCheckedIn
              ? "Welcome Back!"
              : "You're Checked In!"}
          </h1>

          <p className="mt-1 text-xs text-slate-500 font-medium">
            We are so glad to have you with us today.
          </p>

          <div className="my-5 rounded-2xl border border-amber-200/50 bg-[#FAF7F2] p-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-sm font-bold text-white shadow-sm">
                {getInitials(checkInResult.memberName || "Attendee")}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                  Attendee
                </span>
                <span className="block truncate text-base font-bold text-slate-900">
                  {checkInResult.memberName}
                </span>
                <span className="block truncate text-xs text-slate-600 font-medium">
                  {checkInResult.campName}
                </span>
              </div>
            </div>

            <div className="mt-3 border-t border-amber-200/40 pt-2.5">
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Service
              </span>
              <span className="block text-xs font-semibold text-slate-800">
                {checkInResult.sessionTitle}
              </span>
            </div>
          </div>

          {checkInResult.isOffline && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs font-medium text-amber-800 border border-amber-200">
              <WifiOff size={14} className="flex-shrink-0" />
              <span>Offline mode active. Your attendance syncs automatically when back online.</span>
            </div>
          )}

          <p className="text-xs text-slate-500 font-medium">
            Phone linked! Next time you scan the screen, you check in with just 1 tap.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setCheckInResult(null)}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              Done
            </button>

            <a
              href="/register"
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-amber-200/80 bg-white py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50 hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <span>View My Digital Pass</span>
              <ChevronRight size={13} />
            </a>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-sm">
        
        {/* Status Pill Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-white/80 px-3.5 py-1 text-xs font-semibold text-amber-900 shadow-sm backdrop-blur-sm">
            <Heart size={12} className="text-amber-600 fill-amber-500" />
            <span>Community Check-In</span>
          </div>

          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 animate-pulse border border-amber-200">
              <CloudUpload size={12} />
              <span>{pendingSyncCount} syncing</span>
            </div>
          )}
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl border border-amber-200/70 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-md overflow-hidden"
        >
          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-medium text-rose-800"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SCENARIO A: Returning Attendee (Paired Device) */}
          {pairedDevice && !isSwitchingUser && !isGuestMode ? (
            <div className="text-center relative">
              <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 shadow-sm ring-4 ring-amber-200/50 border border-amber-200">
                <span className="text-2xl font-bold tracking-tight">
                  {getInitials(pairedDevice.fullName)}
                </span>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full mb-1">
                <ShieldCheck size={12} className="text-amber-600" /> Linked Device
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                {pairedDevice.fullName}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Tap below to confirm you&apos;re here today.
              </p>

              <button
                onClick={() => handleSubmitCheckIn()}
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Checking in...
                  </>
                ) : (
                  <>
                    <span>1-Tap Check-In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500 font-medium">
                <button
                  type="button"
                  onClick={handleForgetDevice}
                  className="hover:text-slate-800 underline underline-offset-2"
                >
                  Not you? Switch
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsGuestMode(true)}
                  className="hover:text-amber-700 underline underline-offset-2"
                >
                  Guest sign-in
                </button>
              </div>
            </div>
          ) : isGuestMode ? (
            /* SCENARIO B: Inline Guest Registration */
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Guest Sign-In
                  </h2>
                  <p className="text-xs text-slate-500">First time visiting? Welcome!</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuestMode(false)}
                  className="rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitGuest} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Your Full Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 transition-all focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Mobile Phone Number</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g. 09171234567"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 transition-all focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    placeholder="e.g. Invited by friend"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 transition-all focus:border-amber-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Checking in..." : "Check In Now"}
                </button>
              </form>
            </div>
          ) : (
            /* SCENARIO C: First-time Onboarding & Phone Verification */
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Find Your Name
              </h2>
              <p className="mt-0.5 mb-4 text-xs text-slate-500">
                Type your name below to link your phone for fast 1-tap check-ins.
              </p>

              {!selectedMember ? (
                <div>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type your name..."
                      autoFocus
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
                    />
                    <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                  </div>

                  {isSearching && (
                    <div className="py-2 text-center text-xs text-slate-400">
                      Searching names...
                    </div>
                  )}

                  {rosterResults.length > 0 && (
                    <div className="max-h-52 divide-y divide-amber-100 overflow-y-auto rounded-2xl border border-amber-200/80 bg-white shadow-sm">
                      {rosterResults.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMember(m);
                            setErrorMessage(null);
                          }}
                          className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-amber-50/60 hover:translate-x-1"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-900">
                              {getInitials(m.fullName)}
                            </div>
                            <div className="truncate">
                              <span className="block truncate text-xs font-bold text-slate-900">
                                {m.fullName}
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                {m.campName} • {m.role}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-amber-500 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim() && !isSearching && rosterResults.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-amber-200 p-4 text-center text-xs text-slate-500 bg-amber-50/30">
                      No matching name found on the list.
                    </div>
                  )}

                  {/* Prominent Walk-in Guest Button */}
                  <div className="mt-5 border-t border-amber-100 pt-4 text-center">
                    <p className="mb-2 text-xs text-slate-500">First time visiting or not on the list?</p>
                    <button
                      type="button"
                      onClick={() => setIsGuestMode(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/50 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      <UserPlus size={15} className="text-amber-700" />
                      <span>Sign In as a Guest</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected Member: Confirm Phone Number */
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                        Selected Person
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="text-xs font-semibold text-amber-800 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <span className="mt-1 block text-base font-bold text-slate-900">
                      {selectedMember.fullName}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">{selectedMember.campName}</span>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Confirm Mobile Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneDigits}
                        onChange={(e) => setPhoneDigits(e.target.value)}
                        placeholder="e.g. 09171234567 or last 4 digits"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-sm font-medium text-slate-900 transition-all focus:border-amber-600"
                      />
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                      Confirms your identity and links this phone for future 1-tap check-ins.
                    </p>
                  </div>

                  <button
                    onClick={() => handleSubmitCheckIn(selectedMember.id)}
                    disabled={isSubmitting || !phoneDigits.trim()}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Linking & Checking In..." : "Confirm & Check In"}
                  </button>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </main>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6 font-sans">
          <div className="rounded-2xl border border-amber-200 bg-white p-6 text-sm font-semibold text-slate-700 shadow-sm">
            Loading check-in...
          </div>
        </main>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}
