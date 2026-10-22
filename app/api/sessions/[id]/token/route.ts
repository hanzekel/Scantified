import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSessionToken } from "@/lib/tokens";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id, 10);

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: {
        event: true,
        _count: {
          select: { records: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Gate session status: Cannot generate tokens for CANCELLED or CONCLUDED sessions
    if (session.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This session has been cancelled. Check-in is disabled." },
        { status: 403 }
      );
    }

    if (session.status === "CONCLUDED") {
      return NextResponse.json(
        { error: "This session has already concluded. Check-in is closed." },
        { status: 403 }
      );
    }

    // If session is SCHEDULED and requested via presenter, auto-activate it if requested
    const url = new URL(req.url);
    const autoActivate = url.searchParams.get("autoActivate") === "true";
    let currentStatus = session.status;

    if (session.status === "SCHEDULED" && autoActivate) {
      await prisma.eventSession.update({
        where: { id: sessionId },
        data: { status: "ACTIVE" },
      });
      currentStatus = "ACTIVE";
    }

    // Fetch recent attendees for live ticker
    const recentRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId, status: "PRESENT" },
      include: { member: true },
      orderBy: { timeIn: "desc" },
      take: 6,
    });

    // Determine host URL for the QR code payload
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    const tokenData = generateSessionToken(session.id, baseUrl, session.qrSecret);

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        status: currentStatus,
        eventTitle: session.event?.title || "Attendance Session",
        attendeeCount: session._count.records,
        recentAttendees: recentRecords.map((r) => r.member.fullName),
      },
      token: tokenData.token,
      expiresInSeconds: tokenData.expiresInSeconds,
      timeWindow: tokenData.timeWindow,
      checkInUrl: tokenData.checkInUrl,
    });
  } catch (error) {
    console.error("GET /api/sessions/[id]/token error:", error);
    return NextResponse.json(
      { error: "Failed to generate session token" },
      { status: 500 }
    );
  }
}
