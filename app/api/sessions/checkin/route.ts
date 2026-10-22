import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { verifySessionToken } from "@/lib/tokens";

const checkInSchema = z.object({
  sessionId: z.number().int().positive(),
  token: z.string().min(1, "QR token is required"),
  memberId: z.number().int().positive(),
  pairingToken: z.string().optional(),
  phoneNumberDigits: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, token, memberId, pairingToken, phoneNumberDigits } =
      checkInSchema.parse(body);

    // 1. Fetch Session
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This session was cancelled. Attendance cannot be recorded." },
        { status: 403 }
      );
    }

    if (session.status === "CONCLUDED") {
      return NextResponse.json(
        { error: "Check-in window is closed for this session." },
        { status: 403 }
      );
    }

    // 2. Verify Rotating Dynamic QR Token
    const tokenVerification = verifySessionToken(sessionId, token, session.qrSecret);
    if (!tokenVerification.valid) {
      return NextResponse.json(
        { error: tokenVerification.reason || "QR code expired. Please scan the screen again." },
        { status: 400 }
      );
    }

    // 3. Fetch Member & Verify Identity / Device Pairing
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { camp: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found in roster." }, { status: 404 });
    }

    let issuedPairingToken: string | undefined = undefined;

    // A) Known paired device
    if (pairingToken && member.pairingToken && member.pairingToken === pairingToken) {
      // Verified via cached device token
    }
    // B) First-time pairing via phone digits verification
    else if (phoneNumberDigits) {
      const cleanDigits = phoneNumberDigits.replace(/\D/g, "");

      if (member.phoneNumber) {
        const cleanSavedPhone = member.phoneNumber.replace(/\D/g, "");
        const matchesEnd = cleanSavedPhone.endsWith(cleanDigits);
        const matchesExact = cleanSavedPhone === cleanDigits;

        if (!matchesEnd && !matchesExact) {
          return NextResponse.json(
            { error: "Phone number digits do not match roster records. Please check and try again." },
            { status: 401 }
          );
        }
      } else {
        // If no phone on file, save the provided digits as contact phone
        await prisma.member.update({
          where: { id: member.id },
          data: { phoneNumber: cleanDigits },
        });
      }

      // Generate new opaque device pairing token
      issuedPairingToken = crypto.randomUUID();
      await prisma.member.update({
        where: { id: member.id },
        data: { pairingToken: issuedPairingToken },
      });
    } else {
      // Missing verification credentials
      return NextResponse.json(
        { error: "Phone verification required to pair this device." },
        { status: 401 }
      );
    }

    // 4. Record Attendance
    try {
      const record = await prisma.attendanceRecord.create({
        data: {
          sessionId,
          memberId: member.id,
          status: "PRESENT",
          source: "SELF_SCAN",
          timeIn: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        alreadyCheckedIn: false,
        message: "Check-in successful! Welcome!",
        member: {
          id: member.id,
          fullName: member.fullName,
          camp: member.camp?.name || "General",
        },
        sessionTitle: session.title,
        pairingToken: issuedPairingToken || pairingToken,
        recordId: record.id,
      });
    } catch (dbError: any) {
      // Unique constraint on [sessionId, memberId]
      if (dbError.code === "P2002") {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          message: "You are already checked in for this session!",
          member: {
            id: member.id,
            fullName: member.fullName,
            camp: member.camp?.name || "General",
          },
          sessionTitle: session.title,
          pairingToken: issuedPairingToken || pairingToken,
        });
      }
      throw dbError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    console.error("POST /api/sessions/checkin error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}

