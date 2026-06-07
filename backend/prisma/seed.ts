import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando datos iniciales...');

  const adminEmail = 'admin@test.com';
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminPassword, isAdmin: true, role: 'admin' },
    create: {
      email: adminEmail,
      password: adminPassword,
      isAdmin: true,
      role: 'admin',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'working_hours_enabled' },
    update: {},
    create: { key: 'working_hours_enabled', value: '1' },
  });

  await prisma.setting.upsert({
    where: { key: 'working_hours_start' },
    update: {},
    create: { key: 'working_hours_start', value: '13:00' },
  });

  await prisma.setting.upsert({
    where: { key: 'working_hours_end' },
    update: {},
    create: { key: 'working_hours_end', value: '23:59' },
  });

  console.log('Listo. Admin: admin@test.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
