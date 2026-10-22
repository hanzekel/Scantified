import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim() || "";

    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find members matching the search query
    // If the event is linked to a specific camp, scope to that camp; otherwise search all active members
    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        ...(session.event?.campId ? { campId: session.event.campId } : {}),
        ...(query
          ? {
              fullName: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        phoneNumber: true,
        camp: {
          select: {
            name: true,
          },
        },
      },
      take: 25,
      orderBy: { fullName: "asc" },
    });

    // Strip full phone numbers for privacy, just indicate if phone verification is required
    const safeMembers = members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      role: m.role,
      campName: m.camp?.name || "General Roster",
      requiresPhoneVerification: Boolean(m.phoneNumber),
    }));

    return NextResponse.json(safeMembers);
  } catch (error) {
    console.error("GET /api/sessions/[id]/roster error:", error);
    return NextResponse.json(
      { error: "Failed to search roster" },
      { status: 500 }
    );
  }
}

