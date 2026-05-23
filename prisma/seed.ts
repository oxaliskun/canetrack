import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'canetrack2026';
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = [
    {
      name: 'System Admin',
      email: 'admin@canetrack.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      contactNumber: '+63 912 345 6789',
      address: 'Admin Office, Main Building, Central Compound',
    },
    {
      name: 'Mill Operator',
      email: 'operator@canetrack.com',
      passwordHash: hashedPassword,
      role: 'OPERATOR',
      contactNumber: '+63 923 456 7890',
      address: 'Mill Plant, Industrial Zone',
    },
    {
      name: 'Refinery Receiver',
      email: 'receiver@canetrack.com',
      passwordHash: hashedPassword,
      role: 'RECEIVER',
      contactNumber: '+63 934 567 8901',
      address: 'Refinery Complex, Port Area',
    },
    {
      name: 'Sample Farmer',
      email: 'farmer@canetrack.com',
      passwordHash: hashedPassword,
      role: 'FARMER',
      contactNumber: '+63 945 678 9012',
      address: '123 Barangay San Juan, Sugarcane Province',
    },
  ];

  console.log('Seeding users...');

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash: hashedPassword // Ensure password is 'password'
      },
      create: user,
    });
  }

  // Create sample farms for the farmer
  const farmer = await prisma.user.findUnique({ where: { email: 'farmer@canetrack.com' } });
  if (farmer) {
    const existingFarms = await prisma.farm.count({ where: { ownerId: farmer.id } });
    if (existingFarms === 0) {
      await prisma.farm.createMany({
        data: [
          {
            farmName: "Green Valley Plantation",
            location: "Barangay San Juan",
            barangay: "San Juan",
            hectares: 25.5,
            cropType: "Sugarcane (Phil 2000)",
            description: "Main sugarcane plantation with irrigation system.",
            ownerId: farmer.id,
          },
          {
            farmName: "Sunrise Hills Farm",
            location: "Barangay Mabini",
            barangay: "Mabini",
            hectares: 12.0,
            cropType: "Sugarcane (VMC 86-550)",
            description: "Newly planted organic sugarcane field.",
            ownerId: farmer.id,
          },
          {
            farmName: "Riverside Plot",
            location: "Barangay Saging",
            barangay: "Saging",
            hectares: 8.75,
            cropType: "Sugarcane (Phil 7547)",
            description: "Small riverside plot with rich alluvial soil.",
            ownerId: farmer.id,
          },
        ],
      });
      console.log('Seeded 3 farms for sample farmer.');
    }
  }

  // Initialize System Settings
  await prisma.systemSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      varianceThreshold: 50,
      basePricePerKg: 3.50,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
