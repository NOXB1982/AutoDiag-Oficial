"use client"

import { useState } from "react"
import { UserPlus, X, Loader2 } from "lucide-react"
import { createMechanicUser } from "@/app/actions/admin"

export function CreateWorkshopModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const formData = new FormData(e.currentTarget)
            await createMechanicUser(formData)
            setIsOpen(false)
        } catch (err: any) {
            setError(err.message || "Erro desconhecido.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-gray-950 px-4 py-2 font-bold rounded-lg text-sm sm:text-base transition-colors shadow-sm"
            >
                <UserPlus className="h-5 w-5" />
                Nova Oficina
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Criar Perfil de Oficina</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Oficina / Mecânico</label>
                                <input name="name" type="text" required placeholder="Ex: Auto Repair Lda" className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de Acesso</label>
                                <input name="email" type="email" required placeholder="mecanico@oficina.pt" className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Palavra-passe (Provisória)</label>
                                <input name="password" type="text" required placeholder="123456" className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none border" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center justify-center gap-2">
                                {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Adicionar...</> : 'Gravar Perfil'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
