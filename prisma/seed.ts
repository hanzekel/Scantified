import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const camps = [
    "3rd Infantry \"Spearhead\" Division",
    "5th Infantry \"Star\" Division",
    "9th Infantry \"Spear\" Division",
    "Armor \"Pambato\" Division",
    "Basa Air Base",
    "Bonifacio Naval Station",
    "Bureau of Fire Protection",
    "Bureau of Jail Management and Penology",
    "Camp Aguinaldo",
    "Camp Crame",
    "Camp Olivas",
    "Camp Panacan",
    "Camp Riego de Dios",
    "Camp Vicente Lim",
    "Clark Air Base",
    "Fernando Air Base",
    "Fort Bonifacio",
    "Heroesville",
    "Mactan Air Base",
    "Naval Forces Central",
    "Philippine Military Academy",
    "Philippine National Police Academy",
    "Presidential Security Command",
    "Quezon City Police District",
    "Shrine of St. Therese of the Child Jesus",
    "Sangley Point",
    "Southern Police District Compound",
    "Training and Doctrine Command",
    "Villamor Air Base",
    "Visayas Command"
  ];

  console.log('Start seeding camps...');

  for (const campName of camps) {
    // Upsert ensures that if you run this script twice, it won't create duplicates
    const camp = await prisma.camp.upsert({
      where: { name: campName },
      update: {},
      create: {
        name: campName,
      },
    });
    console.log(`Created camp: ${camp.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });