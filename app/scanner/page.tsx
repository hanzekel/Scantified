"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QrCode, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, CloudUpload, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type QueuedScan = { qrCode: string; sessionId: number; timestamp: number };

function ScannerContent() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get("sessionId") || "0", 10);
  const toast = useToast();

  const [lastScan, setLastScan] = useState<{ name: string; camp: string; msg: string; type: "success" | "error" | "offline" } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedScan[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const scanLock = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("dyd26_offline_scans");
    if (saved) setOfflineQueue(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(async (decodedText) => {
      if (scanLock.current) return;
      scanLock.current = true;
      
      setIsScanning(true);
      await processScan(decodedText);
      
      setTimeout(() => {
        scanLock.current = false;
        setIsScanning(false);
      }, 2000);
    }, (error) => {
      // Ignore background scan frame noises
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [sessionId]);

  async function processScan(qrCode: string) {
    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode, sessionId }),
      });

      const data = await res.json();

      if (res.ok) {
        setLastScan({ name: data.member.name, camp: data.member.camp, msg: data.message, type: "success" });
        toast.success(`Verified: ${data.member.name}`);
      } else {
        setLastScan({ name: "Unknown Pass", camp: "---", msg: data.error, type: "error" });
        toast.error(data.error || "Verification failed");
      }
    } catch (error) {
      queueOfflineScan(qrCode);
    }
  }

  function queueOfflineScan(qrCode: string) {
    const newScan = { qrCode, sessionId, timestamp: Date.now() };
    const updatedQueue = [...offlineQueue, newScan];
    setOfflineQueue(updatedQueue);
    localStorage.setItem("dyd26_offline_scans", JSON.stringify(updatedQueue));
    setLastScan({ name: "Queued Offline", camp: "Sync Later", msg: "Network failed. Scan saved to device.", type: "offline" });
    toast.info("Saved scan locally (offline mode)");
  }

  async function handleSync() {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    let remaining = [...offlineQueue];

    for (const scan of offlineQueue) {
      try {
        const res = await fetch("/api/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCode: scan.qrCode, sessionId: scan.sessionId }),
        });
        
        if (res.ok || res.status === 404) {
          remaining = remaining.filter(s => s.timestamp !== scan.timestamp);
        }
      } catch (error) {
        console.error("Sync interrupted", error);
        break;
      }
    }

    setOfflineQueue(remaining);
    localStorage.setItem("dyd26_offline_scans", JSON.stringify(remaining));
    setIsSyncing(false);
    toast.success("Offline queue synced!");
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm rounded-3xl border border-amber-200/70 bg-white/95 p-8 shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <QrCode size={28} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">No Gathering Selected</h2>
          <p className="mt-1 text-xs text-slate-500 mb-6">
            Please select a session gathering to activate the camera scanner.
          </p>
          <Link
            href="/"
            className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 transition-colors inline-block"
          >
            Return to Gatherings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4 font-sans md:p-8">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 flex items-center justify-between rounded-3xl border border-amber-200/60 bg-white/85 p-4 sm:p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href={`/sessions/${sessionId}/dashboard`}
              className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-2 text-amber-950 hover:bg-amber-100/60 transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="font-serif text-xl font-bold text-slate-900">Coordinator Scanner</h1>
              <p className="text-[11px] text-slate-500 font-medium">Session #{sessionId}</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors"
          >
            Cancel
          </Link>
        </header>

        {offlineQueue.length > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CloudUpload size={16} className="text-amber-700" />
              <span>{offlineQueue.length} scans queued locally</span>
            </div>
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="rounded-xl bg-amber-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 transition-colors disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        )}

        <div className={`overflow-hidden rounded-3xl border border-amber-200/70 bg-black shadow-xl transition-opacity duration-300 ${isScanning ? "opacity-50" : "opacity-100"}`}>
          <div id="reader" className="w-full bg-black text-white" />
        </div>

        {lastScan && (
          <div className={`mt-6 rounded-3xl border p-6 text-center shadow-lg transition-all ${
            lastScan.type === "success" 
              ? "border-emerald-200 bg-emerald-50 text-emerald-950" 
              : lastScan.type === "offline" 
              ? "border-amber-200 bg-amber-50 text-amber-950" 
              : "border-rose-200 bg-rose-50 text-rose-950"
          }`}>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
              {lastScan.type === "success" ? (
                <CheckCircle2 size={20} className="text-emerald-600" />
              ) : (
                <AlertCircle size={20} className="text-rose-600" />
              )}
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight">{lastScan.name}</h2>
            <p className="text-xs font-medium opacity-80">{lastScan.camp}</p>
            <div className="mt-3 inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold shadow-sm">
              {lastScan.msg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center text-center font-sans">
        <h2 className="font-serif text-xl font-bold text-slate-800 animate-pulse">Connecting Camera...</h2>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  );
}
