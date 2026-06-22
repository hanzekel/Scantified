import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const scanSchema = z.object({
  qrCode: z.string().min(1, "QR Code is required"),
  sessionId: z.number().int().positive("Session ID is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { qrCode, sessionId } = scanSchema.parse(body);

    // 1. Find the camper by QR code
    const member = await prisma.member.findUnique({
      where: { qrCode },
      include: { camp: true }, // Pull camp data to return to the scanner UI
    });

    if (!member) {
      return NextResponse.json(
        { error: "Unrecognized QR Code. Camper not found." },
        { status: 404 }
      );
    }

    // 2. Log attendance (Sparse Tracking)
    try {
      await prisma.attendanceRecord.create({
        data: {
          sessionId,
          memberId: member.id,
        },
      });

      return NextResponse.json(
        { 
          success: true, 
          member: { name: member.fullName, camp: member.camp?.name || "No Camp" },
          message: "Check-in successful!" 
        },
        { status: 200 }
      );

    } catch (dbError: any) {
      // Prisma error P2002 means the unique constraint failed (already scanned)
      if (dbError.code === "P2002") {
        return NextResponse.json(
          { 
            success: true, // We treat this as a success so the line keeps moving
            member: { name: member.fullName, camp: member.camp?.name || "No Camp" },
            message: "Already checked in." 
          },
          { status: 200 }
        );
      }
      throw dbError; // If it's a different database error, throw it to the catch block
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      return NextResponse.json(
        { error: zodError.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Scanner API error:", error);
    return NextResponse.json(
      { error: "Failed to log attendance due to server error." },
      { status: 500 }
    );
  }
}