"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QrCode, ArrowLeft, Download, CheckCircle2, UserPlus, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";

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
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
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
      toast.success("Registration complete! Please save your pass.");
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
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 mb-2 text-xs font-semibold text-amber-800 hover:text-amber-950 hover:-translate-x-0.5 active:scale-95 transition-all"
        >
          <ArrowLeft size={13} /> Return to Home
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Community Sign-Up
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Register to receive your digital attendance pass. Save it on your phone to check in.
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-amber-200/70 bg-white/95 p-6 sm:p-8 shadow-xl shadow-amber-950/5 backdrop-blur-md overflow-hidden">
        
        {/* State 1: The Form */}
        {!generatedQr ? (
          <>
            <div className="mb-6 border-b border-amber-100 pb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800 border border-amber-200">
                <Heart size={22} className="text-amber-600 fill-amber-500/40" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Sign Up for the Event</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Enter your name and group below to get your personal QR pass.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600 focus:shadow-md"
                  placeholder="e.g. Juan Dela Cruz"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Select Your Camp or Group
                </label>
                <select
                  value={campId}
                  onChange={(e) => setCampId(e.target.value)}
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
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
                disabled={loading || !campId}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Creating Pass..." : "Complete Sign-Up & Download Pass"}
              </button>
            </form>
          </>
        ) : (
          /* State 2: Success & QR Code Display */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 size={32} strokeWidth={2.4} />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900">You&apos;re All Set!</h2>
            <p className="mt-1 text-xs font-medium text-amber-800 bg-amber-50 rounded-full px-3 py-1 inline-block border border-amber-200/80">
              Take a screenshot or save this image to your phone
            </p>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm inline-block">
              <img
                src={generatedQr}
                alt={`QR Code for ${fullName}`}
                className="h-48 w-48 object-contain mx-auto rounded-xl"
              />
            </div>
            
            <p className="mt-4 text-lg font-bold text-slate-900">{fullName}</p>
            <p className="text-xs font-semibold text-amber-800">
              {camps.find((c) => c.id.toString() === campId)?.name}
            </p>

            <button
              onClick={handleDownload}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              <Download size={14} />
              <span>Save Image to Phone</span>
            </button>

            <button
              onClick={() => {
                setGeneratedQr(null);
                setFullName("");
                setCampId("");
              }}
              className="mt-4 w-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              Sign up another person
            </button>
          </div>
        )}
      </div>

    </main>
  );
}
