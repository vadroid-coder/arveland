import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.env.SEED_ADMIN_EMAIL || "admin@arvemaa.ee")
  .trim()
  .toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "admin123";

const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  console.log(`[seed] admin already exists: ${email}`);
} else {
  await prisma.user.create({
    data: {
      email,
      name: "Administrator",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  console.log(`[seed] created admin ${email} / ${password}`);
}

await prisma.$disconnect();
