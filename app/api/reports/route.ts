import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  try {
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Fetch all members, including their camp, and ONLY their record for this specific session
    const members = await prisma.member.findMany({
      include: {
        camp: true,
        records: {
          where: { sessionId: parseInt(sessionId) },
        },
      },
      orderBy: [
        { camp: { name: "asc" } },
        { fullName: "asc" },
      ],
    });

    // Process the data into a clean format for the frontend & Excel
    const reportData = members.map((member) => {
      const isPresent = member.records.length > 0;
      return {
        id: member.id,
        fullName: member.fullName,
        campName: member.camp?.name || "Unassigned",
        role: member.role,
        status: isPresent ? "Present" : "Absent",
        timeIn: isPresent ? member.records[0].timeIn : null,
      };
    });

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}