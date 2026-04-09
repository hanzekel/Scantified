import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

function generateQrCodeValue(name: string) {
  const cleanName = name.trim().toUpperCase().replace(/\s+/g, "-");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `MBR-${cleanName}-${randomPart}`;
}

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: {
        createdAt: "desc",
      },
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
    const { fullName, ministry, role } = body;

    if (!fullName || !ministry || !role) {
      return NextResponse.json(
        { error: "Full name, ministry, and role are required" },
        { status: 400 }
      );
    }

    const qrCode = generateQrCodeValue(fullName);

    const newMember = await prisma.member.create({
      data: {
        fullName,
        ministry,
        role,
        qrCode,
        isActive: true,
      },
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
    console.error("POST /api/members error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}