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
    },
    {
      name: 'Mill Operator',
      email: 'operator@canetrack.com',
      passwordHash: hashedPassword,
      role: 'OPERATOR',
    },
    {
      name: 'Refinery Receiver',
      email: 'receiver@canetrack.com',
      passwordHash: hashedPassword,
      role: 'RECEIVER',
    },
    {
      name: 'Sample Farmer',
      email: 'farmer@canetrack.com',
      passwordHash: hashedPassword,
      role: 'FARMER',
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
