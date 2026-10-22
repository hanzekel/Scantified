"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  QrCode, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Heart, 
  Sparkles, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { playCelebrationChime } from "@/components/ui/audio";

type Camp = {
  id: number;
  name: string;
  colorCode?: string | null;
};

export default function PublicRegistration() {
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [campId, setCampId] = useState("");
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);
  const [registeredCampName, setRegisteredCampName] = useState<string>("");

  useEffect(() => {
    async function fetchCamps() {
      try {
        const res = await fetch("/api/camps");
        const data = await res.json();
        if (res.ok) setCamps(data);
      } catch (error) {
        console.error("Failed to load camps", error);
      }
    }
    fetchCamps();

    // Check if user already has a paired identity
    try {
      const stored = localStorage.getItem("scantified_device_pairing");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fullName && parsed.qrImage) {
          setFullName(parsed.fullName);
          setGeneratedQr(parsed.qrImage);
          setRegisteredCampName(parsed.campName || "Active Member");
        }
      }
    } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedCamp = camps.find((c) => c.id.toString() === campId);
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName, 
          campId: parseInt(campId, 10), 
          role: "Camper"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to register. Please try again.");
        setLoading(false);
        return;
      }

      setGeneratedQr(data.qrImage);
      setRegisteredCampName(selectedCamp?.name || "Community Member");

      // Save pairing locally so they always have their pass
      try {
        localStorage.setItem("scantified_device_pairing", JSON.stringify({
          memberId: data.member.id,
          fullName: data.member.fullName,
          campName: selectedCamp?.name,
          qrImage: data.qrImage,
          pairingToken: `paired_${data.member.id}_${Date.now()}`
        }));
      } catch {}

      playCelebrationChime();
      toast.success("Welcome! Your digital pass has been generated.");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error during registration");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!generatedQr) return;
    const link = document.createElement("a");
    link.href = generatedQr;
    link.download = `Scantified-Pass-${fullName.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info("Pass downloaded! Save it to your photos.");
  }

  return (
    <main className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 sm:p-6 pb-24 md:pb-12 font-sans">
      
      {/* Brand Header */}
      <div className="w-full max-w-sm text-center mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold text-amber-900 shadow-sm">
          <Sparkles size={13} className="text-amber-500 fill-amber-400" />
          <span>Fellowship Digital Pass</span>
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {generatedQr ? "Your Member Pass" : "Get Your Pass"}
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          {generatedQr 
            ? "Keep this pass handy to check in easily when you arrive."
            : "Quick 10-second sign-up to receive your digital attendance badge."}
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-sm">
        {!generatedQr ? (
          /* State 1: Clean Registration Form Card */
          <div className="rounded-3xl border border-amber-200/70 bg-white/95 p-6 sm:p-7 shadow-xl shadow-amber-950/5 backdrop-blur-md">
            <div className="mb-5 border-b border-amber-100 pb-4 text-center">
              <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-200/80">
                <Heart size={20} className="text-amber-600 fill-amber-500/30" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Sign Up for Fellowship</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Enter your details to generate your digital badge.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-amber-200/80 bg-[#FAF9F6] px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-inner transition-all focus:bg-white focus:border-amber-600"
                  placeholder="e.g. Maria Santos"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Camp / Fellowship Group
                </label>
                <select
                  value={campId}
                  onChange={(e) => setCampId(e.target.value)}
                  className="w-full rounded-2xl border border-amber-200/80 bg-[#FAF9F6] px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-inner transition-all focus:bg-white focus:border-amber-600"
                  required
                >
                  <option value="" disabled>Choose your group...</option>
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !campId || !fullName.trim()}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Generating Pass..." : "Create My Digital Pass"}
              </button>
            </form>
          </div>
        ) : (
          /* State 2: Apple Wallet-Style Tactile Pass */
          <div className="relative">
            {/* Ambient Backlight Halo */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-b from-amber-400/20 via-amber-200/10 to-transparent blur-xl" />

            {/* Apple Wallet Pass Container */}
            <div className="relative overflow-hidden rounded-[28px] border border-amber-200/90 bg-white shadow-2xl shadow-amber-950/10">
              
              {/* Pass Header Band */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                      <CreditCard size={15} />
                    </div>
                    <span className="text-xs font-bold tracking-wider uppercase opacity-95">
                      Ministry Pass
                    </span>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md">
                    Verified
                  </span>
                </div>

                <div className="mt-4">
                  <span className="block text-[10px] uppercase tracking-wider text-amber-200/90 font-semibold">
                    Attendee Name
                  </span>
                  <span className="block text-xl font-bold tracking-tight">
                    {fullName}
                  </span>
                </div>
              </div>

              {/* Pass Middle Details */}
              <div className="grid grid-cols-2 gap-3 border-b border-dashed border-amber-200 bg-[#FCFAF7] px-5 py-3">
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Ministry / Group
                  </span>
                  <span className="block text-xs font-bold text-slate-800 truncate">
                    {registeredCampName || "General Cohort"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Member</span>
                  </span>
                </div>
              </div>

              {/* Notch Cutout Illusion */}
              <div className="relative flex items-center justify-between px-2 -my-2.5 z-10 pointer-events-none">
                <div className="h-5 w-5 rounded-full bg-[#FDFBF7] border border-amber-200/70 -ml-3" />
                <div className="h-5 w-5 rounded-full bg-[#FDFBF7] border border-amber-200/70 -mr-3" />
              </div>

              {/* QR Code Presentation Section */}
              <div className="p-6 text-center bg-white">
                <div className="inline-block rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-sm">
                  <img
                    src={generatedQr}
                    alt={`QR Code for ${fullName}`}
                    className="h-44 w-44 object-contain rounded-lg mx-auto"
                  />
                </div>
                <p className="mt-3 text-[11px] font-medium text-slate-500">
                  Show this code to ushers or keep for fast verification.
                </p>
              </div>

              {/* Pass Actions Footer */}
              <div className="border-t border-amber-100 bg-[#FCFAF7] p-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-2.5 text-xs font-semibold text-amber-300 shadow-sm hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  <Download size={14} />
                  <span>Save Image to Photos</span>
                </button>

                <Link
                  href="/checkin"
                  className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-amber-200 bg-white py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50/70 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  <span>Ready to Self Check-In</span>
                  <ArrowRight size={13} />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setGeneratedQr(null);
                    setFullName("");
                    setCampId("");
                  }}
                  className="mt-1 text-center text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Create pass for another person
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

    </main>
  );
}
