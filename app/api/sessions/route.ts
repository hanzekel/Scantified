import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Updated schema to match the new EventSession model
const sessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  eventDay: z.number().int().min(1).max(3),
  sessionType: z.string().min(1, "Session type is required"),
});

export async function GET() {
  try {
    const sessions = await prisma.eventSession.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate body
    const { title, eventDay, sessionType } = sessionSchema.parse(body);

    const session = await prisma.eventSession.create({
      data: {
        title,
        eventDay,
        sessionType,
      },
    });

    // ⚡ SPARSE TRACKING IMPLEMENTED ⚡
    // We do NOT create "Absent" records here anymore.
    // The database remains perfectly quiet until a camper actually scans their QR code.

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      return NextResponse.json(
        { error: zodError.issues[0].message },
        { status: 400 }
      );
    }

    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}