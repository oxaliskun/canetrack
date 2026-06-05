import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'canetrack2026';
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = [
    {
      name: 'Sample Farmer',
      email: 'farmer@canetrack.com',
      passwordHash: hashedPassword,
      contactNumber: '+63 945 678 9012',
      address: '123 Barangay San Juan, Sugarcane Province',
      assignedMill: 'Crystal Sugar Mill',
    },
  ];

  console.log('Seeding users...');

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash: hashedPassword },
      create: user,
    });
  }

  // Seed Bagons for the farmer
  const farmer = await prisma.user.findUnique({ where: { email: 'farmer@canetrack.com' } });
  if (farmer) {
    const existingBagons = await prisma.bagon.count({ where: { ownerId: farmer.id } });
    if (existingBagons === 0) {
      await prisma.bagon.createMany({
        data: [
          { plateNumber: 'ABC-1234', type: '18ft', tareWeight: 3200, ownerId: farmer.id },
          { plateNumber: 'XYZ-5678', type: '20ft', tareWeight: 3800, ownerId: farmer.id },
          { plateNumber: 'DEF-9012', type: '14ft', tareWeight: 2800, ownerId: farmer.id },
        ],
      });
      console.log('Seeded 3 bagons for sample farmer.');
    }
  }

  // Seed Expense Categories
  const expenseCategories = [
    { name: 'Fertilizer', description: 'Fertilizer cost for the season' },
    { name: 'Pesticide', description: 'Pesticide and herbicide costs' },
    { name: 'Irrigation', description: 'Irrigation system and water costs' },
    { name: 'Farm Labor', description: 'General farm labor wages' },
    { name: 'Land Rental', description: 'Land lease or rental fees' },
    { name: 'Equipment Rental', description: 'Heavy equipment rental costs' },
    { name: 'Hauling', description: 'Transport and hauling costs' },
    { name: 'Loading Labor', description: 'Labor cost for loading cane' },
    { name: 'Meals', description: 'Driver/crew meal expenses' },
    { name: 'Miscellaneous', description: 'Other farm-related expenses' },
  ];

  console.log('Seeding expense categories...');
  for (const cat of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

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
