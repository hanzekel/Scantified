import { prisma } from "@/lib/prisma";

export async function updateInactiveMembersForMinistry(ministry: string) {
  const members = await prisma.member.findMany({
    where: { ministry },
    select: {
      id: true,
      isActive: true,
    },
  });

  for (const member of members) {
    const latestSundayRecords = await prisma.attendanceRecord.findMany({
      where: {
        memberId: member.id,
        session: {
          ministry,
          attendanceType: "Sunday",
        },
      },
      include: {
        session: true,
      },
      orderBy: {
        session: {
          attendanceDate: "desc",
        },
      },
      take: 3,
    });

    const hasThreeSundayRecords = latestSundayRecords.length === 3;

    const allAbsent = latestSundayRecords.every(
      (record: (typeof latestSundayRecords)[number]) =>
        record.status === "Absent"
    );

    const shouldBeInactive = hasThreeSundayRecords && allAbsent;

    if (shouldBeInactive && member.isActive) {
      await prisma.member.update({
        where: { id: member.id },
        data: {
          isActive: false,
        },
      });
    }

    if (!shouldBeInactive && !member.isActive) {
      await prisma.member.update({
        where: { id: member.id },
        data: {
          isActive: true,
        },
      });
    }
  }
}