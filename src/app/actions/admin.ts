"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createMechanicUser(data: FormData) {
    const session = await auth()

    if (!session || session.user?.role !== "SUPER_ADMIN") {
        throw new Error("Não autorizado")
    }

    const name = data.get("name") as string
    const email = data.get("email") as string
    const password = data.get("password") as string

    if (!name || !email || !password) {
        throw new Error("Preencha todos os campos")
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    })

    if (existingUser) {
        throw new Error("Já existe uma oficina com este email.")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "MECHANIC",
        }
    })

    revalidatePath("/admin")
    return { success: true }
}

export async function getAdminDashboardStats() {
    const session = await auth()
    if (!session || session.user?.role !== "SUPER_ADMIN") {
        throw new Error("Não autorizado")
    }

    const totalWorkshops = await prisma.user.count({
        where: { role: "MECHANIC" }
    })

    const totalDiagnostics = await prisma.diagnostic.count()

    const workshopsWithStats = await prisma.user.findMany({
        where: { role: "MECHANIC" },
        include: {
            _count: {
                select: { diagnostics: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return { totalWorkshops, totalDiagnostics, workshopsWithStats }
}

export async function deleteMechanicUser(userId: string) {
    const session = await auth()

    if (!session || session.user?.role !== "SUPER_ADMIN") {
        throw new Error("Não tem permissão para remover utilizadores.")
    }

    if (!userId) {
        throw new Error("ID de utilizador inválido.")
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath("/admin")
        return { success: true }
    } catch (error) {
        console.error("Erro ao apagar utilizador:", error)
        throw new Error("Ocorreu um erro ao apagar a oficina.")
    }
}
