import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateInactiveMembersForMinistry } from "@/lib/member-status";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { qrCode, sessionId } = body;

    if (!qrCode || !sessionId) {
      return NextResponse.json(
        { error: "QR code and session ID are required" },
        { status: 400 }
      );
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: Number(sessionId) },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { qrCode },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    if (member.ministry !== session.ministry) {
      return NextResponse.json(
        {
          error: `This member belongs to ${member.ministry}, not ${session.ministry}`,
        },
        { status: 400 }
      );
    }

    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_memberId: {
          sessionId: session.id,
          memberId: member.id,
        },
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Attendance record not found for this session" },
        { status: 404 }
      );
    }

    if (existingRecord.status === "Present") {
      return NextResponse.json(
        {
          error: "Already logged for this session",
          member,
          record: existingRecord,
        },
        { status: 400 }
      );
    }

    const updatedRecord = await prisma.attendanceRecord.update({
      where: {
        sessionId_memberId: {
          sessionId: session.id,
          memberId: member.id,
        },
      },
      data: {
        status: "Present",
        timeIn: new Date(),
      },
    });

    await updateInactiveMembersForMinistry(session.ministry);

    return NextResponse.json({
      message: "Attendance recorded successfully",
      member,
      record: updatedRecord,
    });
  } catch (error) {
    console.error("POST /api/attendance/scan error:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}