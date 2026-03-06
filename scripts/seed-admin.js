const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'admin@autodiag.pt'
    const adminPassword = 'admin'

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    })

    if (existingAdmin) {
        console.log('Super-Admin já existe na base de dados.')
        return
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const admin = await prisma.user.create({
        data: {
            email: adminEmail,
            name: 'Super Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
        },
    })

    console.log('Conta de Super-Admin criada com sucesso:', admin.email)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
