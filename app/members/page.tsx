"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppNavbar from "@/components/app-navbar";
import PageTransition from "@/components/page-transition";
import { motion, AnimatePresence } from "framer-motion";

type Member = {
  id: number;
  fullName: string;
  ministry: string;
  role: string;
  qrCode: string;
  qrImage: string;
  isActive: boolean;
  createdAt: string;
};

export default function MembersPage() {
  const [fullName, setFullName] = useState("");
  const [ministry, setMinistry] = useState("Choir");
  const [role, setRole] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  async function fetchMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("fetchMembers error:", error);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, ministry, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to add member");
        setLoading(false);
        return;
      }

      setMembers((prev) => [data, ...prev]);

      setFullName("");
      setMinistry("Choir");
      setRole("");

      alert("Member added successfully");
    } catch (error) {
      console.error("handleSubmit error:", error);
      alert("Something went wrong while adding the member");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMember(memberId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this member? This will also delete their attendance records."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete member");
        return;
      }

      setMembers((prev) => prev.filter((member) => member.id !== memberId));

      if (selectedMember?.id === memberId) {
        setSelectedMember(null);
      }

      alert("Member deleted successfully");
    } catch (error) {
      console.error("handleDeleteMember error:", error);
      alert("Something went wrong while deleting the member");
    }
  }

  async function handleToggleMemberStatus(memberId: number, isActive: boolean) {
    try {
      const res = await fetch(`/api/members/${memberId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Server returned an invalid response" };
      }

      if (!res.ok) {
        alert(data.error || "Failed to update member status");
        return;
      }

      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, isActive: data.isActive } : member
        )
      );

      if (selectedMember?.id === memberId) {
        setSelectedMember((prev) =>
          prev ? { ...prev, isActive: data.isActive } : prev
        );
      }

      alert(`Member is now ${data.isActive ? "Active" : "Inactive"}`);
    } catch (error) {
      console.error("handleToggleMemberStatus error:", error);
      alert("Something went wrong while updating member status");
    }
  }

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
              Members Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Register and manage church ministry members.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
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

        <div className="grid gap-8 xl:grid-cols-12">
          
          {/* Left Column: Add Member Form */}
          <section className="h-fit border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] xl:col-span-4">
            <div className="mb-6 border-b-2 border-black pb-4">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Add Member
              </p>
              <h2 className="mt-1 text-2xl font-black text-black">
                Register new ministry member
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                Add choir and altar server members so they can be included in QR
                attendance sessions.
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
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Ministry
                </label>
                <div className="relative">
                  <select
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value)}
                    className="w-full appearance-none border-2 border-black bg-white p-3.5 pr-10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="Choir">Choir</option>
                    <option value="Altar Server">Altar Server</option>
                  </select>
                  {/* Custom brutalist dropdown arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black border-l-2 border-black bg-slate-100">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-black">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border-2 border-black bg-white p-3.5 text-black placeholder:text-slate-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:-translate-x-[2px] focus:-translate-y-[2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="Example: Soprano, Tenor, Server"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full border-2 border-black bg-[#E5FF2A] px-6 py-3.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Add Member"}
              </button>
            </form>
          </section>

          {/* Right Column: Members Overview & Table */}
          <section className="flex h-full flex-col border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] xl:col-span-8">
            <div className="mb-6 flex flex-col gap-4 border-b-2 border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                  Members Overview
                </p>
                <h2 className="mt-1 text-2xl font-black text-black">
                  Members List
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  View all registered members and their generated QR codes.
                </p>
              </div>

              <div className="flex h-fit items-center whitespace-nowrap border-2 border-black bg-[#E5FF2A] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Total Members: {members.length}
              </div>
            </div>

            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-black bg-slate-50 p-12 text-center shadow-inner">
                <p className="text-xl font-black text-black">No members yet</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Add your first member using the form on the left.
                </p>
              </div>
            ) : (
              <div className="max-h-[620px] overflow-y-auto overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <table className="min-w-full border-collapse text-left text-black">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b-2 border-black">
                    <tr>
                      <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">QR</th>
                      <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Name</th>
                      <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Ministry</th>
                      <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Role</th>
                      <th className="whitespace-nowrap border-r-2 border-black p-4 font-black">Status</th>
                      <th className="whitespace-nowrap p-4 font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {members.map((member) => (
                      <tr key={member.id} className="border-b-2 border-black last:border-b-0 hover:bg-slate-50">
                        <td className="border-r-2 border-black p-4">
                          <img
                            src={member.qrImage}
                            alt={member.fullName}
                            className="h-14 w-14 border-2 border-black bg-white p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          />
                        </td>
                        <td className="border-r-2 border-black p-4 font-bold">{member.fullName}</td>
                        <td className="border-r-2 border-black p-4">
                          <span className="inline-flex border-2 border-black bg-slate-100 px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {member.ministry}
                          </span>
                        </td>
                        <td className="border-r-2 border-black p-4 font-medium text-slate-700">{member.role}</td>
                        <td className="border-r-2 border-black p-4">
                          <span
                            className={`inline-flex border-2 border-black px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                              member.isActive
                                ? "bg-[#4ADE80] text-black" // Emerald
                                : "bg-slate-300 text-black"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2 min-w-[120px]">
                            <button
                              onClick={() => setSelectedMember(member)}
                              className="border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                              type="button"
                            >
                              View QR
                            </button>

                            <button
                              onClick={() =>
                                handleToggleMemberStatus(member.id, member.isActive)
                              }
                              className="border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                              type="button"
                            >
                              {member.isActive ? "Set Inactive" : "Set Active"}
                            </button>

                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="border-2 border-black bg-[#FF4A4A] px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>

      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-md border-4 border-black bg-white p-6 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-black"
            >
              <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-black pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Member QR Code
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-black">
                    {selectedMember.fullName}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {selectedMember.ministry} • {selectedMember.role} •{" "}
                    {selectedMember.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedMember(null)}
                  className="border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="border-2 border-black bg-slate-50 p-6 text-center shadow-inner">
                <div className="mx-auto flex w-fit items-center justify-center border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <img
                    src={selectedMember.qrImage}
                    alt={selectedMember.fullName}
                    className="h-56 w-56 object-contain"
                  />
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    System ID
                  </p>
                  <p className="mt-1 break-all bg-white border-2 border-black p-2 text-xs font-medium text-black">
                    {selectedMember.qrCode}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-4 pt-4">
                <button
                  onClick={() => window.print()}
                  className="border-2 border-black bg-[#E5FF2A] px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  type="button"
                >
                  Print QR
                </button>

                <button
                  onClick={() => setSelectedMember(null)}
                  className="border-2 border-black bg-white px-6 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  type="button"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}