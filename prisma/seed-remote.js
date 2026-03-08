const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@autodiag.pt' },
    update: {},
    create: {
      email: 'admin@autodiag.pt',
      password: hashedPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });
  
  console.log('Admin user created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
