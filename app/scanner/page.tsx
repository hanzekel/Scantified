"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppNavbar from "@/components/app-navbar";
import PageTransition from "@/components/page-transition";

type ScanResult = {
  message?: string;
  error?: string;
  member?: {
    fullName: string;
    ministry: string;
    role: string;
  };
};

function ScannerContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasStartedRef = useRef(false);
  const cooldownRef = useRef(false);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    if (hasStartedRef.current) return;

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    hasStartedRef.current = true;

    async function startScanner() {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1,
            disableFlip: false,
          },
          async (decodedText) => {
            if (cooldownRef.current) return;

            cooldownRef.current = true;

            try {
              const res = await fetch("/api/attendance/scan", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  qrCode: decodedText,
                  sessionId,
                }),
              });

              const data = await res.json();
              setResult(data);
            } catch {
              setResult({ error: "Scan request failed" });
            } finally {
              setTimeout(() => {
                cooldownRef.current = false;
              }, 2000);
            }
          },
          () => {}
        );

        setCameraReady(true);
      } catch (error) {
        console.error("startScanner error:", error);
        setResult({
          error:
            "Unable to access the camera. Please allow camera permission and try again.",
        });
      }
    }

    startScanner();

    return () => {
      async function cleanup() {
        try {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current?.clear();
        } catch (error) {
          console.error("Scanner cleanup error:", error);
        } finally {
          scannerRef.current = null;
          hasStartedRef.current = false;
          cooldownRef.current = false;
        }
      }

      cleanup();
    };
  }, [sessionId]);

  return (
    <main className="app-shell min-h-screen bg-[#6345ED] selection:bg-[#E5FF2A] selection:text-black">
      <AppNavbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        
        {/* Page Header Banner */}
        <div className="mb-8 flex flex-col gap-6 border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#6345ED]">
              Ministry QR Attendance
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-black">
              QR Attendance Scanner
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Scan a member QR code to record attendance for the selected
              session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/sessions"
              className="border-2 border-black bg-white px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              ← Back
            </Link>

            <Link
              href="/"
              className="border-2 border-black bg-[#E5FF2A] px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Exit to Home
            </Link>
          </div>
        </div>

        {!sessionId ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-black bg-slate-50 p-12 text-center shadow-inner">
            <p className="text-xl font-black text-black">No session selected</p>
            <p className="mt-2 text-sm font-medium text-slate-600 max-w-md">
              Please go back to the Sessions page and open a scanner directly from a
              specific attendance session.
            </p>

            <div className="mt-6">
              <Link
                href="/sessions"
                className="border-2 border-black bg-[#E5FF2A] px-8 py-3.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] inline-block"
              >
                Go to Sessions
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            
            {/* Left Column: Camera Scanner */}
            <section className="h-fit border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-6 flex flex-col gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    Live Scanner
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-black">
                    Scan ministry QR codes
                  </h2>
                </div>

                <div className="flex h-fit items-center whitespace-nowrap border-2 border-black bg-[#E5FF2A] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  Session ID: {sessionId}
                </div>
              </div>

              {/* QR Reader Wrapper */}
              <div className="border-4 border-black bg-slate-100 p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div
                  id="qr-reader"
                  className="overflow-hidden bg-black [&>div]:border-0 [&_video]:object-cover"
                />
              </div>

              <div className="mt-8 border-2 border-black bg-slate-50 p-5 shadow-inner">
                <p className="font-black text-black uppercase tracking-widest text-sm">Scanner tips</p>
                <ul className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                  <li className="flex items-center gap-2"><span className="text-black font-bold">►</span> Brighten the phone that shows the QR code.</li>
                  <li className="flex items-center gap-2"><span className="text-black font-bold">►</span> Hold the QR straight and avoid screen glare.</li>
                  <li className="flex items-center gap-2"><span className="text-black font-bold">►</span> Keep the QR inside the square guide.</li>
                  <li className="flex items-center gap-2"><span className="text-black font-bold">►</span> Move a little closer if the QR looks small.</li>
                </ul>
              </div>
            </section>

            {/* Right Column: Scan Result & Actions */}
            <aside className="space-y-8">
              
              {/* Scan Status Card */}
              <section className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-2 border-black pb-4 mb-6">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    Scan Status
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-black">
                    Current Result
                  </h2>
                </div>

                <div>
                  {!cameraReady && !result ? (
                    <div className="border-2 border-dashed border-black bg-slate-100 p-8 text-center shadow-inner">
                      <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">
                        Starting camera...
                      </p>
                    </div>
                  ) : !result ? (
                    <div className="border-2 border-dashed border-black bg-slate-100 p-8 text-center shadow-inner">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        Waiting for QR scan...
                      </p>
                    </div>
                  ) : result.error ? (
                    <div className="border-4 border-black bg-[#FF4A4A] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-lg font-black text-white uppercase tracking-wide border-b-2 border-white/30 pb-3 mb-3">
                        ⚠️ {result.error}
                      </p>

                      {result.member && (
                        <div className="space-y-1 text-sm font-bold text-white">
                          <p className="text-xl">{result.member.fullName}</p>
                          <p className="text-white/90">{result.member.role}</p>
                          <p className="text-white/90">{result.member.ministry}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-4 border-black bg-[#4ADE80] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-lg font-black text-black uppercase tracking-wide border-b-2 border-black/20 pb-3 mb-3">
                        ✓ {result.message}
                      </p>

                      {result.member && (
                        <div className="space-y-1 text-sm font-bold text-black/80">
                          <p className="text-xl text-black">{result.member.fullName}</p>
                          <p>{result.member.role}</p>
                          <p>{result.member.ministry}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Navigation Card */}
              <section className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-2 border-black pb-4 mb-6">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    Navigation
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-black">
                    Quick Actions
                  </h2>
                </div>

                <div className="flex flex-col gap-4">
                  <Link
                    href="/sessions"
                    className="w-full border-2 border-black bg-[#E5FF2A] px-6 py-3.5 text-center text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] block"
                  >
                    Back to Sessions
                  </Link>

                  <Link
                    href="/members"
                    className="w-full border-2 border-black bg-white px-6 py-3.5 text-center text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] block"
                  >
                    View Members
                  </Link>

                  <Link
                    href="/"
                    className="w-full border-2 border-black bg-white px-6 py-3.5 text-center text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] block"
                  >
                    Exit to Home
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default function ScannerPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell min-h-screen bg-[#6345ED] selection:bg-[#E5FF2A] selection:text-black">
          <AppNavbar />
          <section className="mx-auto max-w-7xl px-6 py-10">
            <div className="border-2 border-black bg-white p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl font-black text-black animate-pulse uppercase tracking-widest">
                Loading scanner...
              </p>
            </div>
          </section>
        </main>
      }
    >
      <ScannerContent />
    </Suspense>
  );
}