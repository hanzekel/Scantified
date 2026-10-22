import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        schedule: true,
        camp: true,
        sessions: {
          orderBy: { date: "asc" },
          include: {
            _count: {
              select: { records: true },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const sessionStats = {
      total: event.sessions.length,
      scheduled: event.sessions.filter((s) => s.status === "SCHEDULED").length,
      active: event.sessions.filter((s) => s.status === "ACTIVE").length,
      concluded: event.sessions.filter((s) => s.status === "CONCLUDED").length,
      cancelled: event.sessions.filter((s) => s.status === "CANCELLED").length,
    };

    return NextResponse.json({
      event,
      stats: sessionStats,
    });
  } catch (error) {
    console.error("GET /api/events/[id]/calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event calendar" },
      { status: 500 }
    );
  }
}

