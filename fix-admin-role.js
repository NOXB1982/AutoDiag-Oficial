const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetAdminRole() {
    try {
        const u = await prisma.user.update({
            where: { email: 'admin@autodiag.pt' },
            data: { role: 'SUPER_ADMIN' }
        })
        console.log('User role updated to:', u.role)
    } catch (err) {
        console.log('Error updating user role:', err)
    } finally {
        await prisma.$disconnect()
    }
}

resetAdminRole()
