"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function saveDiagnostic(vehicle: string, parameters: any, diagnosis: string) {
    const session = await auth()

    if (!session || !session.user?.id) {
        throw new Error("Sessão expirada. Inicie sessão para gravar.")
    }

    try {
        await prisma.diagnostic.create({
            data: {
                userId: session.user.id,
                vehicle,
                parameters: JSON.stringify(parameters),
                diagnosis
            }
        })
        return { success: true }
    } catch (error) {
        console.error("Erro ao guardar diagnóstico:", error)
        throw new Error("Erro de servidor ao guardar no histórico da oficina.")
    }
}
