import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  sessionType: z.string().optional(),
  status: z.enum(["SCHEDULED", "ACTIVE", "CONCLUDED", "CANCELLED"]).optional(),
  date: z.string().optional(),
});

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
        records: {
          include: { member: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id, 10);

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const body = await req.json();
    const data = updateSessionSchema.parse(body);

    const updated = await prisma.eventSession.update({
      where: { id: sessionId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.sessionType && { sessionType: data.sessionType }),
        ...(data.status && { status: data.status }),
        ...(data.date && { date: new Date(data.date) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("PATCH /api/sessions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
