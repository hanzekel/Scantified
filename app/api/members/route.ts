import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";

// Updated schema to match the new Member model
const memberSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  campId: z.number().int().positive("Camp is required"),
  role: z.enum(["Camper", "Coordinator", "Core Team", "Guest"]).default("Camper"),
});

// Helper function to generate a readable, random QR code string
function generateQrCodeValue(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `DYD26-${cleanName}-${randomPart}`;
}

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      include: { camp: true },
      orderBy: { createdAt: "desc" },
    });

    const membersWithQrImage = await Promise.all(
      members.map(async (member: (typeof members)[number]) => {
        const qrImage = member.qrCode ? await QRCode.toDataURL(member.qrCode) : null;
        return {
          ...member,
          qrImage,
        };
      })
    );

    return NextResponse.json(membersWithQrImage);
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate body against the updated schema
    const { fullName, campId, role } = memberSchema.parse(body);

    const qrCode = generateQrCodeValue(fullName);

    const newMember = await prisma.member.create({
      data: {
        fullName,
        campId,
        role,
        qrCode,
        isActive: true,
      },
      include: { camp: true },
    });

    const qrImage = newMember.qrCode ? await QRCode.toDataURL(newMember.qrCode) : null;

    return NextResponse.json(
      {
        ...newMember,
        qrImage,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      return NextResponse.json(
        { error: zodError.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    
    console.error("POST /api/members error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
