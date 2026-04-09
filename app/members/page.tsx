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
    <main className="app-shell">
      <AppNavbar />

      <section className="section-container relative z-10 py-10 text-white">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
              Ministry QR Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Members Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Register and manage church ministry members.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="secondary-button">
              ← Back
            </Link>

            <Link href="/" className="primary-button">
              Exit to Home
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-card rounded-[28px] p-6">
            <div className="mb-5">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                Add Member
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">
                Register new ministry member
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Add choir and altar server members so they can be included in QR
                attendance sessions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white placeholder:text-white/60"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Ministry
                </label>
                <select
                  value={ministry}
                  onChange={(e) => setMinistry(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white"
                >
                  <option value="Choir" className="text-black">
                    Choir
                  </option>
                  <option value="Altar Server" className="text-black">
                    Altar Server
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white placeholder:text-white/60"
                  placeholder="Example: Soprano, Tenor, Server"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full disabled:opacity-60"
              >
                {loading ? "Saving..." : "Add Member"}
              </button>
            </form>
          </section>

          <section className="glass-card rounded-[28px] p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                  Members Overview
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  Members List
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  View all registered members and their generated QR codes.
                </p>
              </div>

              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                Total Members: {members.length}
              </div>
            </div>

            {members.length === 0 ? (
              <div className="rounded-3xl border border-white/15 bg-white/10 p-10 text-center">
                <p className="text-lg font-semibold text-white">
                  No members yet
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Add your first member using the form on the left.
                </p>
              </div>
            ) : (
              <div className="max-h-[620px] overflow-y-auto rounded-3xl border border-white/15 bg-white/10">
                <table className="min-w-full border-collapse text-left text-white">
                  <thead className="sticky top-0 z-10 bg-white/10 backdrop-blur-md">
                    <tr>
                      <th className="p-4">QR</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Ministry</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-t border-white/10">
                        <td className="p-4">
                          <img
                            src={member.qrImage}
                            alt={member.fullName}
                            className="h-14 w-14 rounded-xl border border-white/20 bg-white p-1"
                          />
                        </td>
                        <td className="p-4 font-semibold">{member.fullName}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            {member.ministry}
                          </span>
                        </td>
                        <td className="p-4 text-white/85">{member.role}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
                              member.isActive
                                ? "border border-emerald-300/25 bg-emerald-400/15 text-white"
                                : "border border-red-300/25 bg-red-400/15 text-white"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setSelectedMember(member)}
                              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/15"
                              type="button"
                            >
                              View QR
                            </button>

                            <button
                              onClick={() =>
                                handleToggleMemberStatus(member.id, member.isActive)
                              }
                              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/15"
                              type="button"
                            >
                              {member.isActive ? "Set Inactive" : "Set Active"}
                            </button>

                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="rounded-full border border-red-300/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-red-500/25"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-[28px] p-6 text-white">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/75">
                  Member QR Code
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  {selectedMember.fullName}
                </h2>
                <p className="mt-2 text-sm text-white/80">
                  {selectedMember.ministry} • {selectedMember.role} •{" "}
                  {selectedMember.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="secondary-button"
                type="button"
              >
                Close
              </button>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-white/10 p-6 text-center">
              <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-4">
                <img
                  src={selectedMember.qrImage}
                  alt={selectedMember.fullName}
                  className="h-56 w-56"
                />
              </div>

              <p className="mt-4 text-sm font-semibold text-white/90">
                QR Code Value
              </p>
              <p className="mt-2 break-all text-sm text-white/75">
                {selectedMember.qrCode}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="primary-button"
                type="button"
              >
                Print QR
              </button>

              <button
                onClick={() => setSelectedMember(null)}
                className="secondary-button"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
    </main>
  );
}