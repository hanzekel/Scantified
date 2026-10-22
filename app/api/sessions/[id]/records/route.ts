// app/api/sessions/[id]/records/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { AttendanceRecord } from "@prisma/client";

const overrideRecordSchema = z.object({
  memberId: z.number().int().positive(),
  status: z.enum(["PRESENT", "EXCUSED", "ABSENT"]),
  notes: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id, 10);

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID", code: "INVALID_ID" }, { status: 400 });
    }

    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: {
        event: {
          include: { camp: true },
        },
        records: {
          include: { member: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // Determine target cohort members
    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        ...(session.event?.campId ? { campId: session.event.campId } : {}),
      },
      include: { camp: true },
      orderBy: { fullName: "asc" },
    });

    // Map existing attendance records by memberId
    const recordMap = new Map<number, (typeof session.records)[number]>();
    for (const r of session.records) {
      recordMap.set(r.memberId, r);
    }

    // Combine roster with session records
    const rosterWithRecords = members.map((m) => {
      const rec = recordMap.get(m.id);
      return {
        id: m.id,
        fullName: m.fullName,
        role: m.role,
        campName: m.camp?.name || "General Roster",
        phoneNumber: m.phoneNumber,
        status: rec ? rec.status : "ABSENT",
        source: rec?.source || null,
        notes: rec?.notes || null,
        timeIn: rec?.timeIn || null,
        recordId: rec?.id || null,
      };
    });

    const presentCount = rosterWithRecords.filter((r) => r.status === "PRESENT").length;
    const excusedCount = rosterWithRecords.filter((r) => r.status === "EXCUSED").length;
    const absentCount = rosterWithRecords.filter((r) => r.status === "ABSENT").length;
    const effectiveTotal = rosterWithRecords.length - excusedCount;
    const rate = effectiveTotal > 0 ? Math.round((presentCount / effectiveTotal) * 100) : 0;

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        sessionType: session.sessionType,
        date: session.date,
        eventTitle: session.event?.title || "Attendance Session",
      },
      stats: {
        totalRoster: rosterWithRecords.length,
        present: presentCount,
        excused: excusedCount,
        absent: absentCount,
        attendanceRate: rate,
      },
      roster: rosterWithRecords,
    });
  } catch (error) {
    console.error("GET /api/sessions/[id]/records error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session records" },
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

    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const { memberId, status, notes } = overrideRecordSchema.parse(body);

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let recordResult: AttendanceRecord | null = null;

    if (status === "ABSENT") {
      // Remove any existing attendance record
      await prisma.attendanceRecord.deleteMany({
        where: {
          sessionId,
          memberId,
        },
      });
      return NextResponse.json({
        success: true,
        status: "ABSENT",
        message: `${member.fullName} marked as absent.`,
      });
    }

    // Upsert record for PRESENT or EXCUSED
    recordResult = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_memberId: {
          sessionId,
          memberId,
        },
      },
      create: {
        sessionId,
        memberId,
        status,
        source: "MANUAL_OVERRIDE",
        notes: notes || (status === "EXCUSED" ? "Excused absence" : "Manual check-in by coordinator"),
        timeIn: new Date(),
      },
      update: {
        status,
        source: "MANUAL_OVERRIDE",
        notes: notes !== undefined ? notes : (status === "EXCUSED" ? "Excused absence" : "Manual check-in by coordinator"),
      },
    });

    return NextResponse.json({
      success: true,
      status: recordResult.status,
      message: `${member.fullName} marked as ${status}.`,
      record: recordResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("PATCH /api/sessions/[id]/records error:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

