// app/api/events/[id]/analytics/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateEventAnalytics } from "@/lib/analytics";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID", code: "INVALID_ID" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        camp: true,
        sessions: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // Fetch members assigned to this cohort (or all active members if general event)
    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        ...(event.campId ? { campId: event.campId } : {}),
      },
      include: { camp: true },
      orderBy: { fullName: "asc" },
    });

    // Fetch all attendance records across the event sessions
    const sessionIds = event.sessions.map((s) => s.id);
    const records = await prisma.attendanceRecord.findMany({
      where: {
        sessionId: { in: sessionIds },
      },
      select: {
        sessionId: true,
        memberId: true,
        status: true,
      },
    });

    const analytics = calculateEventAnalytics(
      event.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        date: s.date,
        sessionType: s.sessionType,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      members.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        campName: m.camp?.name || "General Roster",
        role: m.role,
        createdAt: m.createdAt,
      })),
      records
    );

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        campName: event.camp?.name || "All Cohorts",
      },
      ...analytics,
    });
  } catch (error) {
    console.error("GET /api/events/[id]/analytics error:", error);
    return NextResponse.json(
      { error: "Failed to generate event analytics", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

