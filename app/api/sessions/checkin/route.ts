// app/api/sessions/checkin/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { verifySessionToken } from "@/lib/tokens";

const checkInSchema = z.object({
  sessionId: z.number().int().positive(),
  token: z.string().min(1, "QR token is required"),
  timeWindow: z.number().int().optional(),
  
  // Either existing member check-in
  memberId: z.number().int().positive().optional(),
  pairingToken: z.string().optional(),
  phoneNumberDigits: z.string().optional(),

  // Or inline guest registration & check-in (Spec L53)
  guestName: z.string().min(1).optional(),
  guestPhone: z.string().optional(),
  guestNotes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = checkInSchema.parse(body);
    const { sessionId, token, timeWindow, memberId, pairingToken, phoneNumberDigits, guestName, guestPhone, guestNotes } = data;

    // 1. Fetch Session
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (session.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This session was cancelled. Attendance cannot be recorded.", code: "SESSION_CANCELLED" },
        { status: 403 }
      );
    }

    if (session.status === "CONCLUDED") {
      return NextResponse.json(
        { error: "Check-in window is closed for this session.", code: "SESSION_CONCLUDED" },
        { status: 403 }
      );
    }

    // 2. Verify Rotating Dynamic QR Token (with offline timeWindow tolerance)
    const tokenVerification = verifySessionToken(sessionId, token, session.qrSecret, {
      timeWindow,
      maxOfflineHours: 24,
    });

    if (!tokenVerification.valid) {
      return NextResponse.json(
        { 
          error: tokenVerification.reason || "QR code expired. Please scan the screen again.",
          code: "TOKEN_EXPIRED" 
        },
        { status: 400 }
      );
    }

    // 3. Case A: Inline Guest Check-In (Single endpoint per Spec L53)
    if (guestName && !memberId) {
      // Find default camp/cohort
      let camp = session.event?.campId 
        ? await prisma.camp.findUnique({ where: { id: session.event.campId } })
        : null;

      if (!camp) {
        camp = await prisma.camp.findFirst();
        if (!camp) {
          camp = await prisma.camp.create({
            data: { name: "Guest Visitors", colorCode: "#F59E0B" },
          });
        }
      }

      // Check if guest already exists by exact name and camp
      let member = await prisma.member.findFirst({
        where: {
          fullName: guestName.trim(),
          campId: camp.id,
        },
      });

      if (!member) {
        member = await prisma.member.create({
          data: {
            fullName: guestName.trim(),
            campId: camp.id,
            role: "Guest",
            phoneNumber: guestPhone?.trim() || null,
            isActive: true,
          },
        });
      }

      // Record attendance
      try {
        const record = await prisma.attendanceRecord.create({
          data: {
            sessionId,
            memberId: member.id,
            status: "PRESENT",
            source: "GUEST_SELF_REGISTER",
            notes: guestNotes?.trim() ? `Guest: ${guestNotes.trim()}` : "First-time Guest",
            timeIn: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          alreadyCheckedIn: false,
          message: "Welcome! Your guest attendance is confirmed.",
          member: {
            id: member.id,
            fullName: member.fullName,
            camp: camp.name,
            role: "Guest",
          },
          sessionTitle: session.title,
          recordId: record.id,
        });
      } catch (dbError: any) {
        if (dbError.code === "P2002") {
          return NextResponse.json({
            success: true,
            alreadyCheckedIn: true,
            message: "Welcome back! You are already checked in.",
            member: {
              id: member.id,
              fullName: member.fullName,
              camp: camp.name,
              role: "Guest",
            },
            sessionTitle: session.title,
          });
        }
        throw dbError;
      }
    }

    // 4. Case B: Enrolled Member Check-In & Device Pairing
    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID or guest name is required", code: "MISSING_IDENTITY" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { camp: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found in roster.", code: "MEMBER_NOT_FOUND" },
        { status: 404 }
      );
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
            { 
              error: "Phone number digits do not match roster records. Please check and try again.",
              code: "PHONE_MISMATCH"
            },
            { status: 401 }
          );
        }
      } else {
        // If no phone on file, register the provided digits
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
      return NextResponse.json(
        { error: "Phone verification required to pair this device.", code: "PAIRING_REQUIRED" },
        { status: 401 }
      );
    }

    // 5. Record Member Attendance
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
        { error: error.issues[0]?.message || "Validation error", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    console.error("POST /api/sessions/checkin error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
