import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const ministry = searchParams.get("ministry");
    const attendanceType = searchParams.get("attendanceType");
    const attendanceDate = searchParams.get("attendanceDate");

    const records = await prisma.attendanceRecord.findMany({
      where: {
        session: {
          ...(ministry ? { ministry } : {}),
          ...(attendanceType ? { attendanceType } : {}),
          ...(attendanceDate
            ? {
                attendanceDate: {
                  gte: new Date(`${attendanceDate}T00:00:00.000Z`),
                  lte: new Date(`${attendanceDate}T23:59:59.999Z`),
                },
              }
            : {}),
        },
      },
      include: {
        member: true,
        session: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}