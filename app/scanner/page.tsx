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
    <main className="app-shell">
      <AppNavbar />

      <section className="section-container relative z-10 py-10 text-white">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
              Ministry QR Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              QR Attendance Scanner
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Scan a member QR code to record attendance for the selected
              session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sessions" className="secondary-button">
              ← Back
            </Link>

            <Link href="/" className="primary-button">
              Exit to Home
            </Link>
          </div>
        </div>

        {!sessionId ? (
          <div className="glass-card rounded-[28px] p-8">
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-6">
              <p className="text-lg font-bold text-white">No session selected.</p>
              <p className="mt-2 text-sm text-white/80">
                Please go back to the Sessions page and open a scanner from a
                specific attendance session.
              </p>

              <div className="mt-5">
                <Link href="/sessions" className="primary-button">
                  Go to Sessions
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="glass-card rounded-[28px] p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                    Live Scanner
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-white">
                    Scan ministry QR codes
                  </h2>
                </div>

                <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                  Session ID: {sessionId}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/15 bg-white/10 p-4">
                <div
                  id="qr-reader"
                  className="overflow-hidden rounded-2xl [&>div]:border-0 [&_video]:rounded-2xl [&_video]:object-cover"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/85">
                <p className="font-semibold text-white">Scanner tips</p>
                <ul className="mt-2 space-y-1 text-white/75">
                  <li>• Brighten the phone that shows the QR code.</li>
                  <li>• Hold the QR straight and avoid screen glare.</li>
                  <li>• Keep the QR inside the square guide.</li>
                  <li>• Move a little closer if the QR looks small.</li>
                  <li>• Use the rear camera for better focus.</li>
                </ul>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="glass-card rounded-[28px] p-6">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                  Scan Status
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  Current Result
                </h2>

                <div className="mt-5">
                  {!cameraReady && !result ? (
                    <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-center">
                      <p className="text-sm text-white/75">
                        Starting camera...
                      </p>
                    </div>
                  ) : !result ? (
                    <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-center">
                      <p className="text-sm text-white/75">
                        Waiting for QR scan...
                      </p>
                    </div>
                  ) : result.error ? (
                    <div className="rounded-3xl border border-red-300/30 bg-red-500/15 p-6">
                      <p className="text-lg font-bold text-white">
                        {result.error}
                      </p>

                      {result.member && (
                        <div className="mt-4 space-y-1 text-sm text-white/85">
                          <p className="font-semibold">{result.member.fullName}</p>
                          <p>{result.member.role}</p>
                          <p>{result.member.ministry}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-emerald-300/30 bg-emerald-500/15 p-6">
                      <p className="text-lg font-bold text-white">
                        {result.message}
                      </p>

                      {result.member && (
                        <div className="mt-4 space-y-1 text-sm text-white/85">
                          <p className="font-semibold">{result.member.fullName}</p>
                          <p>{result.member.role}</p>
                          <p>{result.member.ministry}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="glass-card rounded-[28px] p-6">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                  Navigation
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  Quick Actions
                </h2>

                <div className="mt-5 flex flex-col gap-3">
                  <Link href="/sessions" className="primary-button justify-center">
                    Back to Sessions
                  </Link>

                  <Link href="/members" className="secondary-button justify-center">
                    View Members
                  </Link>

                  <Link href="/" className="secondary-button justify-center">
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
        <main className="app-shell">
          <AppNavbar />
          <section className="section-container relative z-10 py-10 text-white">
            <div className="glass-card rounded-[28px] p-8 text-center">
              <p className="text-lg font-semibold text-white">Loading scanner...</p>
            </div>
          </section>
        </main>
      }
    >
      <ScannerContent />
    </Suspense>
  );
}