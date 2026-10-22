import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateEventAnalytics } from "@/lib/analytics";
import * as XLSX from "xlsx";

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
        camp: true,
        sessions: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        ...(event.campId ? { campId: event.campId } : {}),
      },
      include: { camp: true },
      orderBy: { fullName: "asc" },
    });

    const sessionIds = event.sessions.map((s) => s.id);
    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { sessionId: true, memberId: true, status: true },
    });

    const analytics = calculateEventAnalytics(
      event.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        date: s.date,
        sessionType: s.sessionType,
        status: s.status,
      })),
      members.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        campName: m.camp?.name || "General Roster",
        role: m.role,
      })),
      records
    );

    // Build tabular matrix for spreadsheet
    const sessionHeaders = analytics.sessions.map(
      (s) => `${s.title} (${new Date(s.date).toLocaleDateString()})`
    );

    const headerRow = [
      "Member Name",
      "Cohort / Camp",
      "Role",
      ...sessionHeaders,
      "Attended (P)",
      "Excused (E)",
      "Absent (A)",
      "Attendance Rate (%)",
      "Current Streak",
      "Tier",
    ];

    const dataRows = analytics.allMembers.map((m) => {
      const sessionCodes = analytics.sessions.map((s) => m.sessionStatuses[s.id] || "A");
      return [
        m.fullName,
        m.campName,
        m.role,
        ...sessionCodes,
        m.attendedCount,
        m.excusedCount,
        m.absentCount,
        `${m.rate}%`,
        m.currentStreak,
        m.tier === "MOST_PRESENT"
          ? "Most Present (Regular)"
          : m.tier === "AT_RISK"
          ? "At-Risk / Irregular"
          : "No Attendance",
      ];
    });

    const sheetData = [headerRow, ...dataRows];

    // Generate Excel Workbook
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Matrix");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const cleanFileName = event.title.replace(/[^a-zA-Z0-9_-]/g, "_");

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="attendance-matrix-${cleanFileName}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/events/[id]/export error:", error);
    return NextResponse.json(
      { error: "Failed to export attendance matrix" },
      { status: 500 }
    );
  }
}

