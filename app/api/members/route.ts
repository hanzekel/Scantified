import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";

// Updated schema to use campId instead of ministry
const memberSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  campId: z.number().int().positive("Camp selection is required"),
  role: z.string().default("Camper"),
});

function generateQrCodeValue(name: string) {
  const cleanName = name.trim().toUpperCase().replace(/\s+/g, "-");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `DYD26-${cleanName}-${randomPart}`;
}

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      include: { camp: true }, // Pull the relational Camp data
      orderBy: { createdAt: "desc" },
    });

    const membersWithQrImage = await Promise.all(
      members.map(async (member: (typeof members)[number]) => {
        const qrImage = await QRCode.toDataURL(member.qrCode);
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
      include: { camp: true } // Return the camp data with the newly created member
    });

    const qrImage = await QRCode.toDataURL(newMember.qrCode);

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
        { error: zodError.issues[0].message },
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