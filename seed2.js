const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.user.updateMany({
      where: { email: 'admin@autodiag.pt' },
      data: { role: 'SUPER_ADMIN' }
    });

    console.log('Role updated to SUPER_ADMIN!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
