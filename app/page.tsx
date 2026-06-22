"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type EventSession = {
  id: number;
  title: string;
  eventDay: number;
  sessionType: string;
  date: string;
};

export default function Dashboard() {
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [title, setTitle] = useState("");
  const [eventDay, setEventDay] = useState("1");
  const [sessionType, setSessionType] = useState("Plenary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    const res = await fetch("/api/sessions");
    if (res.ok) setSessions(await res.json());
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, eventDay: parseInt(eventDay), sessionType }),
      });
      if (res.ok) {
        setTitle("");
        fetchSessions();
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
        
        <header className="mb-10 flex items-end justify-between border-b-4 border-black pb-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-black md:text-5xl">
              DYD26 Command
            </h1>
            <p className="mt-2 text-lg font-bold text-[#FF4A4A]">
              Event Session Management
            </p>
          </div>
          <Link href="/register" className="hidden border-4 border-black bg-white px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-1 hover:-translate-y-1 md:block">
            View Public Registration ↗
          </Link>
        </header>

        <div className="mb-12 border-4 border-black bg-[#E5FF2A] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-6 text-2xl font-black uppercase text-black">Create New Session</h2>
          <form onSubmit={handleCreateSession} className="grid gap-4 md:grid-cols-4 md:items-end">
            <div className="md:col-span-2">
              <label className="mb-2 block font-bold text-black">Session Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Plenary, Camp Wars"
                className="w-full border-2 border-black bg-white p-3 font-bold outline-none transition-transform focus:-translate-x-1 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                required
              />
            </div>
            <div>
              <label className="mb-2 block font-bold text-black">Event Day</label>
              <select
                value={eventDay}
                onChange={(e) => setEventDay(e.target.value)}
                className="w-full border-2 border-black bg-white p-3 font-bold outline-none transition-transform focus:-translate-x-1 focus:-translate-y-1 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <option value="1">Day 1</option>
                <option value="2">Day 2</option>
                <option value="3">Day 3</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full border-2 border-black bg-[#6345ED] p-3 font-black uppercase text-white transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isSubmitting ? "Opening..." : "Open Session"}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-black uppercase text-black">Active Sessions</h2>
          {sessions.length === 0 ? (
            <div className="border-4 border-dashed border-black p-12 text-center font-bold text-slate-500">
              No sessions created yet.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex flex-col justify-between border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="border-2 border-black bg-black px-2 py-1 text-xs font-black uppercase text-white">
                        Day {session.eventDay}
                      </span>
                      <span className="border-2 border-black bg-[#4ADE80] px-2 py-1 text-xs font-black uppercase text-black">
                        {session.sessionType}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase text-black">{session.title}</h3>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      Opened: {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/scanner?sessionId=${session.id}`}
                    className="mt-6 block w-full border-2 border-black bg-black p-3 text-center font-black uppercase text-white transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:bg-[#6345ED] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Launch Scanner →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}