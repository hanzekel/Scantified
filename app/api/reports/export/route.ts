import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const records = await prisma.attendanceRecord.findMany({
      include: {
        member: true,
        session: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const rows = records.map((record) => ({
      "Member Name": record.member.fullName,
      Ministry: record.member.ministry,
      Role: record.member.role,
      "Session Title": record.session.title,
      "Attendance Type": record.session.attendanceType,
      "Attendance Date": new Date(
        record.session.attendanceDate
      ).toLocaleDateString(),
      Status: record.status,
      "Time In": record.timeIn
        ? new Date(record.timeIn).toLocaleTimeString()
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Records");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="attendance-records.xlsx"',
      },
    });
  } catch (error) {
    console.error("GET /api/reports/export error:", error);
    return NextResponse.json(
      { error: "Failed to export attendance records" },
      { status: 500 }
    );
  }
}