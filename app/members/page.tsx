"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, UserPlus, Search, QrCode, Sparkles, Shield, Heart } from "lucide-react";
import { useToast } from "@/components/ui/toast";

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
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
      toast.error("Could not load directory");
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
        body: JSON.stringify({ fullName, campId: parseInt(campId, 10), role }),
      });
      if (res.ok) {
        setFullName("");
        setCampId("");
        setRole("Camper");
        toast.success(`Added ${fullName} to the directory!`);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Could not add person");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error adding person");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getInitials(name: string) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (name[0] || "?").toUpperCase();
  }

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.camp?.name && m.camp.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 font-sans">
      <div className="mx-auto max-w-5xl">
        
        {/* Header Bar */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-amber-200/60 bg-white/85 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-900 border border-amber-200/70 mb-2">
              <Users size={13} className="text-amber-600" />
              <span>People & Camp Groups</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              People Directory
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Everyone enrolled in your ministry. Search names, assign camp groups, and view digital passes.
            </p>
          </div>

          <Link
            href="/register"
            className="flex items-center gap-1.5 rounded-2xl border border-amber-200/80 bg-white/90 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
          >
            <UserPlus size={14} />
            <span>Public Sign-Up Page ↗</span>
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Registration Form Card */}
          <div className="warm-card h-fit p-6 sm:p-7 lg:col-span-1">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800 border border-amber-200">
                <UserPlus size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Add a Person
                </h2>
                <p className="text-xs text-slate-500">Add someone new to your community list</p>
              </div>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Gabriel Reyes"
                  required
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Assign Group / Camp</label>
                <select
                  value={campId}
                  onChange={(e) => setCampId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
                >
                  <option value="" disabled>Choose group...</option>
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-2xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 shadow-sm transition-all focus:border-amber-600"
                >
                  <option value="Camper">Camper</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !campId}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-xs font-semibold text-white shadow-md shadow-amber-700/20 hover:from-amber-700 hover:to-amber-800 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save to Directory"}
              </button>
            </form>
          </div>

          {/* Members List */}
          <div className="lg:col-span-2">
            
            {/* Search Filter Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Enrolled People
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {filteredMembers.length} people found
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, camp, role..."
                  className="w-full rounded-2xl border border-amber-200/80 bg-white/90 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 transition-all focus:border-amber-600 shadow-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-amber-200/60 bg-white/80 p-12 text-center backdrop-blur-md">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-700">Loading directory...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-amber-200 bg-white/70 p-12 text-center text-xs font-medium text-slate-500">
                No people match your search.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="warm-card-interactive flex items-center gap-3.5 p-4"
                  >
                    {/* Pass QR Code or Avatar */}
                    <div className="relative flex-shrink-0">
                      {member.qrImage ? (
                        <img
                          src={member.qrImage}
                          alt={`${member.fullName} Pass`}
                          className="h-16 w-16 rounded-xl border border-amber-200 bg-white object-contain p-1 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100/70 text-sm font-bold text-amber-900 border border-amber-200">
                          {getInitials(member.fullName)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {member.fullName}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-amber-100/70 border border-amber-200/80 px-2 py-0.2 text-[10px] font-semibold text-amber-900">
                          {member.camp?.name || "No Group"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-600">
                          {member.role}
                        </span>
                      </div>
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
