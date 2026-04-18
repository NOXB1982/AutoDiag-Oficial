"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function saveDiagnostic(vehicle: string, parameters: any, diagnosis: string, type: string = "obd", image: string | null = null) {
    const session = await auth()

    if (!session || !session.user?.id) {
        throw new Error("Sessão expirada. Inicie sessão para gravar.")
    }

    try {
        const diag = await prisma.diagnostic.create({
            data: {
                userId: session.user.id,
                type,
                vehicle,
                parameters: JSON.stringify(parameters),
                diagnosis,
                image
            }
        })
        return { success: true, diagnostic: diag }
    } catch (error) {
        console.error("Erro ao guardar diagnóstico:", error)
        throw new Error("Erro de servidor ao guardar no histórico da oficina.")
    }
}

export async function getUserDiagnostics() {
    const session = await auth()

    if (!session || !session.user?.id) {
        return []
    }

    try {
        const diagnostics = await prisma.diagnostic.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return diagnostics
    } catch (error) {
        console.error("Erro ao carregar histórico:", error)
        return []
    }
}
