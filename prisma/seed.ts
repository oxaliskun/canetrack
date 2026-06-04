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

  // Seed Expense Categories
  const expenseCategories = [
    // Delivery type
    { name: 'Diesel', type: 'DELIVERY', description: 'Fuel cost for truck during delivery' },
    { name: 'Toll Fee', type: 'DELIVERY', description: 'Toll road expenses during transport' },
    { name: 'Truck Repair', type: 'DELIVERY', description: 'Maintenance and repair costs' },
    { name: 'Loading Labor', type: 'DELIVERY', description: 'Labor cost for loading cane' },
    { name: 'Unloading Labor', type: 'DELIVERY', description: 'Labor cost for unloading cane' },
    { name: 'Meals', type: 'DELIVERY', description: 'Driver/crew meal expenses' },
    // Farm type
    { name: 'Fertilizer', type: 'FARM', description: 'Fertilizer cost for the season' },
    { name: 'Pesticide', type: 'FARM', description: 'Pesticide and herbicide costs' },
    { name: 'Irrigation', type: 'FARM', description: 'Irrigation system and water costs' },
    { name: 'Farm Labor', type: 'FARM', description: 'General farm labor wages' },
    { name: 'Land Rental', type: 'FARM', description: 'Land lease or rental fees' },
    { name: 'Equipment Rental', type: 'FARM', description: 'Heavy equipment rental costs' },
    { name: 'Miscellaneous', type: 'FARM', description: 'Other farm-related expenses' },
  ];

  console.log('Seeding expense categories...');
  for (const cat of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Seed Sugarcane Variants
  const sugarcaneVariants = [
    { name: 'Phil 93-93', characteristics: 'High yielding, good ratooning ability, suited for mill sites' },
    { name: 'Phil 99-1793', characteristics: 'High sugar content, resistant to smut disease' },
    { name: 'VMC 86-550', characteristics: 'Early maturing, high tonnage, good for clay soil' },
    { name: 'VMC 92-129', characteristics: 'Very high sugar recovery, moderately resistant to borer' },
    { name: 'Phil 2000-2567', characteristics: 'Excellent ratooning, good drought tolerance, high biomass' },
  ];

  console.log('Seeding sugarcane variants...');
  for (const v of sugarcaneVariants) {
    await prisma.sugarcaneVariant.upsert({
      where: { name: v.name },
      update: {},
      create: v,
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
