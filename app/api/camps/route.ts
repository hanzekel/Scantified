import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const camps = await prisma.camp.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(camps);
  } catch (error) {
    console.error("GET /api/camps error:", error);
    return NextResponse.json({ error: "Failed to fetch camps" }, { status: 500 });
  }
}

// Temporary POST route so you can quickly add Camps via Postman or a script
export async function POST(req: Request) {
  try {
    const { name, colorCode } = await req.json();
    const newCamp = await prisma.camp.create({
      data: { name, colorCode },
    });
    return NextResponse.json(newCamp, { status: 201 });
  } catch (error) {
    console.error("POST /api/camps error:", error);
    return NextResponse.json({ error: "Failed to create camp" }, { status: 500 });
  }
}