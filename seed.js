const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const adminPass = await bcrypt.hash('admin', 10);
    const userPass = await bcrypt.hash('oficina123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@autodiag.pt' },
      update: {},
      create: { 
        email: 'admin@autodiag.pt', 
        password: adminPass, 
        role: 'admin' 
      }
    });

    await prisma.user.upsert({
      where: { email: 'oficina@exemplo.pt' },
      update: {},
      create: { 
        email: 'oficina@exemplo.pt', 
        password: userPass, 
        role: 'user' 
      }
    });

    console.log('Seeded users!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
