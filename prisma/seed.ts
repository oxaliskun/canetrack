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
