"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize,
  Minimize,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Lock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type TokenData = {
  session: {
    id: number;
    title: string;
    status: string;
    eventTitle: string;
    attendeeCount: number;
    recentAttendees?: string[];
  };
  token: string;
  expiresInSeconds: number;
  timeWindow: number;
  checkInUrl: string;
};

export default function SessionPresenterPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const toast = useToast();

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(20);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  // Live digital clock
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch token function
  async function fetchToken(autoActivate = true) {
    if (!sessionId) return;
    try {
      setIsRotating(true);
      const res = await fetch(
        `/api/sessions/${sessionId}/token?autoActivate=${autoActivate}`
      );
      if (res.ok) {
        const data: TokenData = await res.json();
        setTokenData(data);
        setCountdown(data.expiresInSeconds);
        setErrorMsg(null);

        // Generate crisp high-contrast QR code
        const dataUrl = await QRCode.toDataURL(data.checkInUrl, {
          width: 580,
          margin: 1,
          color: {
            dark: "#0C1322",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(dataUrl);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Could not load check-in QR code");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error connecting to token server");
    } finally {
      setIsRotating(false);
    }
  }

  useEffect(() => {
    fetchToken(true);
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchToken(false);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  }

  async function confirmLockSession() {
    setIsLocking(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONCLUDED" }),
      });
      if (res.ok) {
        setShowLockDialog(false);
        toast.info("Attendance closed for this session.");
        fetchToken(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to close attendance.");
    } finally {
      setIsLocking(false);
    }
  }

  // Circular progress calculations for 20s token
  const strokeRadius = 18;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (countdown / 20) * strokeCircumference;

  if (errorMsg) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white/95 p-8 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Closed</h1>
          <p className="mt-2 mb-6 text-sm text-slate-600 font-sans">{errorMsg}</p>
          <button
            onClick={() => router.back()}
            className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            ← Return to Session
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col justify-between p-4 sm:p-6 md:p-8 overflow-hidden font-sans bg-[#FDFBF7]">
      
      {/* Floating Exit Theater Button if Theater Mode is Active */}
      {theaterMode ? (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setTheaterMode(false)}
            className="flex items-center gap-1.5 rounded-2xl border border-amber-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-md hover:bg-white hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <span>Exit Theater Mode</span>
            <Minimize size={13} />
          </button>
        </div>
      ) : (
        /* Standard Header Bar */
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200/60 bg-white/85 px-6 py-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link
              href={`/sessions/${sessionId}/dashboard`}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100/60 hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <ArrowLeft size={14} /> Back to List
            </Link>
            <div>
              <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                <span>{tokenData?.session.eventTitle || "Church Gathering"}</span>
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                <span className="text-amber-700/80">Check-In Active</span>
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {tokenData?.session.title || "Loading Session..."}
              </h1>
            </div>
          </div>

          {/* Live Controls & Digital Clock */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200/60 bg-white px-3.5 py-2 font-mono text-xs font-semibold text-slate-800 shadow-sm">
              <Clock size={15} className="text-amber-600" />
              <span>{currentTime}</span>
            </div>

            <button
              onClick={() => setTheaterMode(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-amber-300/80 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-500/20 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
              title="Hide all controls for projector"
            >
              <Sparkles size={14} className="text-amber-600" />
              <span className="hidden sm:inline">Theater View</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="rounded-2xl border border-amber-200/60 bg-white p-2 text-slate-700 hover:bg-amber-50 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>

            <button
              onClick={() => setShowLockDialog(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:-translate-y-0.5 active:scale-95 transition-all"
              title="End check-in for this service"
            >
              <Lock size={13} />
              <span className="hidden sm:inline">Close Attendance</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Center Presenter Stage with Radiant Golden Halo */}
      <div className="relative my-auto flex flex-col items-center justify-center py-6 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] sm:h-[600px] sm:w-[600px] rounded-full bg-gradient-to-br from-amber-300/30 via-amber-200/15 to-transparent blur-3xl -z-10" />

        {/* User-Friendly Instructions Pill */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-4 py-1.5 text-xs font-semibold text-amber-900 shadow-sm backdrop-blur-sm">
          <Sparkles size={14} className="text-amber-500 fill-amber-400" />
          <span>Point your phone camera here to check in</span>
        </div>

        {/* QR Code Presentation Frame with Apple-style Lift */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-3xl border border-amber-300/70 bg-white p-6 shadow-2xl shadow-amber-950/10 sm:p-8"
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Dynamic Check-In QR Code"
              className="h-64 w-64 rounded-2xl object-contain sm:h-80 sm:w-80 md:h-96 md:w-96"
            />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80 md:h-96 md:w-96">
              <RefreshCw className="h-10 w-10 animate-spin text-amber-600" />
            </div>
          )}

          {/* Simple Explanation of Security Code */}
          <div className="mt-5 flex items-center justify-between border-t border-amber-100 pt-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck size={16} className="text-amber-600" />
              <span>Fresh QR Code • Refreshes to prevent screenshots</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-800">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <svg className="h-8 w-8 -rotate-90 transform" viewBox="0 0 44 44">
                  <circle
                    cx="22"
                    cy="22"
                    r={strokeRadius}
                    className="stroke-amber-100"
                    strokeWidth="3.5"
                    fill="none"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r={strokeRadius}
                    className={`transition-all duration-1000 ease-linear ${
                      countdown <= 4 ? "stroke-rose-500" : "stroke-amber-600"
                    }`}
                    strokeWidth="3.5"
                    strokeDasharray={strokeCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-slate-900">{countdown}</span>
              </div>
              <span className="text-slate-500 text-[11px]">sec</span>
            </div>
          </div>
        </motion.div>

        {/* Friendly Phone Fallback Helper */}
        <p className="mt-4 text-xs font-medium text-slate-500">
          Camera not working? Type this link on your phone:{" "}
          <span className="font-mono font-semibold text-amber-700 underline underline-offset-2">
            {tokenData?.checkInUrl}
          </span>
        </p>
      </div>

      {/* Bottom Live Headcount & Recent Arrival Ticker Bar */}
      <footer className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200/60 bg-white/85 p-4 shadow-sm backdrop-blur-md transition-all ${
        theaterMode ? "max-w-2xl mx-auto w-full justify-center bg-white/90" : ""
      }`}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white px-5 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800">
              <Users className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <div>
              <span className="block text-[9px] font-semibold text-amber-800 uppercase tracking-wider">
                Checked In
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {tokenData?.session.attendeeCount || 0}
              </span>
            </div>
          </div>

          {/* Real-time Attendee Arrival Floating Cards */}
          {tokenData?.session.recentAttendees && tokenData.session.recentAttendees.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Just Arrived:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {tokenData.session.recentAttendees.map((name, i) => (
                    <motion.div
                      key={`${name}-${i}`}
                      initial={{ scale: 0.8, opacity: 0, y: 5 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>{name}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {!theaterMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchToken(false)}
              disabled={isRotating}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={12} className={isRotating ? "animate-spin" : ""} /> Refresh Code
            </button>
          </div>
        )}
      </footer>

      {/* Lock Session Confirmation Dialog */}
      <Dialog
        isOpen={showLockDialog}
        onClose={() => setShowLockDialog(false)}
        title="Close Attendance for this Session?"
        description="Attendees will no longer be able to scan the on-screen code. You can reopen attendance anytime from the attendee list."
      >
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => setShowLockDialog(false)}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            Keep Open
          </button>
          <button
            type="button"
            onClick={confirmLockSession}
            disabled={isLocking}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLocking ? "Closing..." : "Yes, Close Attendance"}
          </button>
        </div>
      </Dialog>
    </main>
  );
}
