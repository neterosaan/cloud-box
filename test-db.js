import 'dotenv/config';
import prisma from './src/config/prisma.js';

async function test() {
  try {
    console.log("⏳ Connecting to database...");
    
    // 1. Try to create a test user
    const newUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        clerkId: `test_clerk_${Date.now()}`,
      },
    });
    console.log("✅ Successfully created user:", newUser.email);

    // 2. Try to find the user
    const foundUser = await prisma.user.findUnique({
      where: { id: newUser.id },
    });
    console.log("✅ Successfully found user in DB!");

    // 3. Clean up (Optional: delete the test user)
    await prisma.user.delete({ where: { id: newUser.id } });
    console.log("✅ Test finished. Database is working perfectly!");

  } catch (error) {
    console.error("❌ Database test failed!");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();