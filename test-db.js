const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function test() {
    const u = await prisma.user.findUnique({
        where: { email: 'admin@autodiag.pt' }
    })
    if (!u) {
        return console.log('User not found')
    }
    console.log('Valid:', await bcrypt.compare('admin', u.password))
    console.log(u)
}

test().finally(() => prisma.$disconnect())
