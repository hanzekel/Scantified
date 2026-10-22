import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { verifySessionToken } from "@/lib/tokens";

const guestSchema = z.object({
  sessionId: z.number().int().positive(),
  token: z.string().min(1, "QR token is required"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phoneNumber: z.string().min(4, "Phone number is required"),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, token, fullName, phoneNumber, notes } = guestSchema.parse(body);

    // 1. Fetch Session
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "CANCELLED" || session.status === "CONCLUDED") {
      return NextResponse.json(
        { error: "Check-in is closed for this session." },
        { status: 403 }
      );
    }

    // 2. Verify Dynamic QR Token
    const tokenVerification = verifySessionToken(sessionId, token, session.qrSecret);
    if (!tokenVerification.valid) {
      return NextResponse.json(
        { error: tokenVerification.reason || "QR code expired. Please scan the screen again." },
        { status: 400 }
      );
    }

    // 3. Resolve Camp / Cohort for the new guest
    let targetCampId: number;

    if (session.event?.campId) {
      targetCampId = session.event.campId;
    } else {
      // Find or create a default "Visitors & Guests" camp
      let defaultCamp = await prisma.camp.findFirst({
        where: { name: "Visitors & Guests" },
      });

      if (!defaultCamp) {
        defaultCamp = await prisma.camp.findFirst();
      }

      if (!defaultCamp) {
        defaultCamp = await prisma.camp.create({
          data: {
            name: "Visitors & Guests",
            colorCode: "#6345ED",
          },
        });
      }

      targetCampId = defaultCamp.id;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const pairingToken = crypto.randomUUID();

    // 4. Create Guest Member & AttendanceRecord in transaction
    const result = await prisma.$transaction(async (tx) => {
      const guestMember = await tx.member.create({
        data: {
          fullName: fullName.trim(),
          phoneNumber: cleanPhone,
          role: "Guest",
          campId: targetCampId,
          pairingToken,
          isActive: true,
        },
        include: { camp: true },
      });

      const record = await tx.attendanceRecord.create({
        data: {
          sessionId,
          memberId: guestMember.id,
          status: "PRESENT",
          source: "SELF_SCAN",
          notes: notes ? `Guest: ${notes}` : "First-time Guest Self-Registration",
          timeIn: new Date(),
        },
      });

      return { guestMember, record };
    });

    return NextResponse.json({
      success: true,
      message: "Welcome! Guest registration and check-in confirmed.",
      member: {
        id: result.guestMember.id,
        fullName: result.guestMember.fullName,
        camp: result.guestMember.camp?.name || "Visitors",
        role: result.guestMember.role,
      },
      pairingToken,
      sessionTitle: session.title,
      recordId: result.record.id,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("POST /api/sessions/guest error:", error);
    return NextResponse.json(
      { error: "Failed to register guest" },
      { status: 500 }
    );
  }
}

