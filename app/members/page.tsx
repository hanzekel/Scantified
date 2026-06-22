"use client";

import { useState, useEffect } from "react";

type Camp = { id: number; name: string };
type Member = {
  id: number;
  fullName: string;
  camp: Camp;
  role: string;
  qrImage: string;
  isActive: boolean;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [campId, setCampId] = useState("");
  const [role, setRole] = useState("Camper");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [membersRes, campsRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/camps"),
      ]);
      if (membersRes.ok) setMembers(await membersRes.json());
      if (campsRes.ok) setCamps(await campsRes.json());
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, campId: parseInt(campId), role }),
      });
      if (res.ok) {
        setFullName("");
        setCampId("");
        setRole("Camper");
        fetchData(); // Refresh list
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans selection:bg-[#E5FF2A] selection:text-black md:p-12">
      <div className="mx-auto max-w-5xl">
        
        <header className="mb-10 border-b-4 border-black pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black md:text-5xl">
            Campers Directory
          </h1>
          <p className="mt-2 text-lg font-bold text-[#6345ED]">
            Manage DYD26 delegates and view assigned camps.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Admin Add Form */}
          <div className="h-fit border-4 border-black bg-[#6345ED] p-6 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] lg:col-span-1">
            <h2 className="mb-6 text-2xl font-black uppercase text-[#E5FF2A]">
              Manual Registration
            </h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="mb-2 block font-bold">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-2 border-black bg-white p-3 text-black outline-none transition-transform focus:-translate-x-1 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block font-bold">Assign Camp</label>
                <select
                  value={campId}
                  onChange={(e) => setCampId(e.target.value)}
                  className="w-full border-2 border-black bg-white p-3 text-black outline-none transition-transform focus:-translate-x-1 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  required
                >
                  <option value="" disabled>Select a camp...</option>
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-bold">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border-2 border-black bg-white p-3 text-black outline-none transition-transform focus:-translate-x-1 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="Camper">Camper</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full border-2 border-black bg-[#E5FF2A] p-4 font-black uppercase text-black transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Member"}
              </button>
            </form>
          </div>

          {/* Members List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-xl font-bold uppercase">Loading Roster...</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
                    <img src={member.qrImage} alt="QR" className="h-20 w-20 border-2 border-black object-contain p-1" />
                    <div>
                      <h3 className="text-lg font-black uppercase line-clamp-1">{member.fullName}</h3>
                      <span className="mt-1 inline-block border-2 border-black bg-slate-200 px-2 py-1 text-xs font-bold uppercase">
                        {member.camp?.name || "No Camp"}
                      </span>
                      <p className="mt-1 text-xs font-bold text-slate-500 uppercase">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}