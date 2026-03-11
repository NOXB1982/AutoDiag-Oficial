"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { deleteMechanicUser } from "@/app/actions/admin"

interface DeleteWorkshopButtonProps {
    userId: string
    userName: string
}

export function DeleteWorkshopButton({ userId, userName }: DeleteWorkshopButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (window.confirm(`Tens a certeza que queres remover a oficina "${userName}"? Todos os dados em "Análises de Osciloscópio" e "OBD2" associados a esta oficina serão eliminados e a ação não é reversível.`)) {
            try {
                setIsDeleting(true)
                await deleteMechanicUser(userId)
            } catch (error) {
                console.error(error)
                alert("Erro ao remover a oficina. Verifique se tem as permissões adequadas.")
            } finally {
                setIsDeleting(false)
            }
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
            title="Remover Oficina"
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    )
}
