import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const records = await prisma.attendanceRecord.findMany({
      where: {
        session: {
          attendanceDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        member: true,
        session: true,
      },
    });

    const presenceMap = new Map<
      string,
      { fullName: string; ministry: string; role: string; total: number }
    >();

    const absenceMap = new Map<
      string,
      { fullName: string; ministry: string; role: string; total: number }
    >();

    const ministryMap = new Map<string, number>();
    const typeMap = new Map<string, number>();

    for (const record of records) {
      const key = String(record.member.id);

      if (record.status === "Present") {
        if (!presenceMap.has(key)) {
          presenceMap.set(key, {
            fullName: record.member.fullName,
            ministry: record.member.ministry,
            role: record.member.role,
            total: 0,
          });
        }
        presenceMap.get(key)!.total += 1;
      }

      if (record.status === "Absent") {
        if (!absenceMap.has(key)) {
          absenceMap.set(key, {
            fullName: record.member.fullName,
            ministry: record.member.ministry,
            role: record.member.role,
            total: 0,
          });
        }
        absenceMap.get(key)!.total += 1;
      }

      ministryMap.set(
        record.member.ministry,
        (ministryMap.get(record.member.ministry) || 0) + 1
      );

      typeMap.set(
        record.session.attendanceType,
        (typeMap.get(record.session.attendanceType) || 0) + 1
      );
    }

    const topPresentMembers = Array.from(presenceMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topAbsentMembers = Array.from(absenceMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const totalsByMinistry = Array.from(ministryMap.entries()).map(
      ([name, total]) => ({
        name,
        total,
      })
    );

    const totalsByType = Array.from(typeMap.entries()).map(([name, total]) => ({
      name,
      total,
    }));

    return NextResponse.json({
      totalRecords: records.length,
      topPresentMembers,
      topAbsentMembers,
      totalsByMinistry,
      totalsByType,
    });
  } catch (error) {
    console.error("GET /api/reports/monthly error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly report" },
      { status: 500 }
    );
  }
}