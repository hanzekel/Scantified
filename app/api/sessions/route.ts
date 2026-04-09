import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateInactiveMembersForMinistry } from "@/lib/member-status";

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
    const { title, attendanceDate, attendanceType, ministry } = body;

    if (!title || !attendanceDate || !attendanceType || !ministry) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

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
        data: activeMembers.map((member) => ({
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
    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}