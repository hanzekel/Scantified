import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateInactiveMembersForMinistry } from "@/lib/member-status";
import { z } from "zod";

// Strict validation schema for incoming session data
const sessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  attendanceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  attendanceType: z.enum(["Sunday", "Friday", "Practice", "Special Event"]),
  ministry: z.enum(["Choir", "Altar Server"]),
});

export async function GET() {
  try {
    const sessions = await prisma.attendanceSession.findMany({
      orderBy: {
        createdAt: "desc",
      },
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
    
    // Validate body against the schema
    const validatedData = sessionSchema.parse(body);
    const { title, attendanceDate, attendanceType, ministry } = validatedData;

    const session = await prisma.attendanceSession.create({
      data: {
        title,
        attendanceDate: new Date(attendanceDate),
        attendanceType,
        ministry,
      },
    });

    const activeMembers = await prisma.member.findMany({
      where: {
        ministry,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (activeMembers.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: activeMembers.map((member: (typeof activeMembers)[number]) => ({
          sessionId: session.id,
          memberId: member.id,
          status: "Absent",
          timeIn: null,
        })),
      });
    }

    await updateInactiveMembersForMinistry(ministry);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    // Catch Zod validation errors safely and explicitly type cast for build-time safety
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      return NextResponse.json(
        { error: zodError.errors[0].message },
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