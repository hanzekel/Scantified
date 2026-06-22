"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";

// Define the shape of our Camp data
type Camp = {
  id: number;
  name: string;
  colorCode?: string | null;
};

export default function PublicRegistration() {
  const [fullName, setFullName] = useState("");
  const [campId, setCampId] = useState("");
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(false);
  
  // This state holds the generated QR image once registration is successful
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);

  // Fetch the camps when the page loads so the user can select one
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
          role: "Camper" // Default role for public registration
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to register. Please try again.");
        setLoading(false);
        return;
      }

      // Registration successful! Set the QR image to display it.
      setGeneratedQr(data.qrImage);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // Helper function so users can easily save the QR to their phone
  function handleDownload() {
    if (!generatedQr) return;
    const link = document.createElement("a");
    link.href = generatedQr;
    link.download = `DYD26-QR-${fullName.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <main className="min-h-screen bg-[#6345ED] selection:bg-[#E5FF2A] selection:text-black flex flex-col items-center justify-center p-6">
      
      {/* DYD Header */}
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          DYD26
        </h1>
        <p className="mt-2 text-sm font-bold uppercase tracking-widest text-[#E5FF2A]">
          Camper Registration
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-md border-4 border-black bg-white p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        {/* State 1: The Form */}
        {!generatedQr ? (
          <>
            <div className="mb-6 border-b-2 border-black pb-4 text-center">
              <h2 className="text-2xl font-black text-black">Join your Camp</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                Register to generate your personal DYD26 Event ID. You will need this QR code to enter sessions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-2 border-black bg-white p-3.5 text-black placeholder:text-slate-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Select Camp
                </label>
                <div className="relative">
                  <select
                    value={campId}
                    onChange={(e) => setCampId(e.target.value)}
                    className="w-full appearance-none border-2 border-black bg-white p-3.5 pr-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    required
                  >
                    <option value="" disabled>Choose your camp...</option>
                    {camps.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center border-l-2 border-black bg-slate-100 px-4 text-black">
                    ▼
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !campId}
                className="mt-6 w-full border-2 border-black bg-[#E5FF2A] px-6 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Generating ID..." : "Register Now"}
              </button>
            </form>
          </>
        ) : (
          /* State 2: Success & QR Code Display */
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-black bg-[#4ADE80] text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ✓
            </div>
            <h2 className="text-2xl font-black text-black">Registration Complete!</h2>
            <p className="mt-2 text-sm font-bold text-[#FF4A4A] border-b-2 border-black pb-4">
              CRITICAL: Save this QR code. You need it for attendance!
            </p>

            <div className="mt-6 border-4 border-black bg-slate-50 p-4 shadow-inner inline-block">
              <img
                src={generatedQr}
                alt={`QR Code for ${fullName}`}
                className="h-48 w-48 object-contain mx-auto"
              />
            </div>
            
            <p className="mt-4 text-xl font-black text-black uppercase">{fullName}</p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {camps.find(c => c.id.toString() === campId)?.name}
            </p>

            <button
              onClick={handleDownload}
              className="mt-8 w-full border-2 border-black bg-[#E5FF2A] px-6 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              ↓ Download Image
            </button>

            <button
               onClick={() => window.location.reload()}
               className="mt-4 w-full text-xs font-bold text-slate-500 underline underline-offset-4 hover:text-black"
            >
              Register another camper
            </button>
          </div>
        )}
      </div>

    </main>
  );
}