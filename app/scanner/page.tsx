"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type QueuedScan = { qrCode: string; sessionId: number; timestamp: number };

// 1. We move the main logic into a child component
function ScannerContent() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get("sessionId") || "0", 10);

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
      // Ignore background read errors
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
      } else {
        setLastScan({ name: "Unknown", camp: "---", msg: data.error, type: "error" });
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
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase">No Session Selected</h2>
          <Link href="/" className="mt-4 inline-block border-2 border-black bg-[#E5FF2A] px-6 py-3 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 p-4 font-sans selection:bg-[#E5FF2A] selection:text-black md:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center justify-between border-b-4 border-black pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">Scanner</h1>
          <Link href="/" className="font-bold underline underline-offset-4 hover:text-[#6345ED]">
            Cancel
          </Link>
        </header>

        {offlineQueue.length > 0 && (
          <div className="mb-6 flex items-center justify-between border-4 border-black bg-[#FF4A4A] p-4 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-bold">{offlineQueue.length} Scans Queued Offline</span>
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="border-2 border-white bg-black px-4 py-2 text-sm font-black uppercase transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        )}

        <div className={`overflow-hidden border-4 border-black bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-colors duration-300 ${isScanning ? "opacity-50" : "opacity-100"}`}>
          <div id="reader" className="w-full bg-black text-white" />
        </div>

        {lastScan && (
          <div className={`mt-8 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center animate-in slide-in-from-bottom-4 ${
            lastScan.type === "success" ? "bg-[#4ADE80]" : 
            lastScan.type === "offline" ? "bg-[#E5FF2A]" : "bg-[#FF4A4A] text-white"
          }`}>
            <h2 className="text-3xl font-black uppercase tracking-tight">{lastScan.name}</h2>
            <p className="mt-1 text-lg font-bold uppercase">{lastScan.camp}</p>
            <div className="mt-4 inline-block border-2 border-current bg-black/10 px-4 py-2 font-bold uppercase tracking-widest">
              {lastScan.msg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 2. We wrap the export in the required Suspense boundary
export default function ScannerPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-center">
        <h2 className="text-2xl font-black uppercase animate-pulse">Loading Scanner...</h2>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  );
}