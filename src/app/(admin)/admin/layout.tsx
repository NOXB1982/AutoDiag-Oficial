import { auth } from "@/auth"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type MiddlewareProps = {
    children: React.ReactNode
}

export default async function AdminLayout({ children }: MiddlewareProps) {
    const session = await auth()

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        return (
            <div className="flex min-h-screen items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
                Não tem permissões de SUPER_ADMIN para aceder à plataforma de gestão de oficinas.
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen border-t-4 border-lime-500 dark:border-lime-500 bg-gray-50 dark:bg-gray-950">
            <div className="py-4 px-6 md:px-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-6">
                    <h1 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 text-sm mt-1">
                        Gestão Autodiag <span className="bg-lime-500 text-gray-950 px-2 rounded-full text-xs font-bold font-mono">ADMIN SERVER</span>
                    </h1>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar à Oficina
                </Link>
            </div>
            <main className="flex-1 p-6 lg:p-10">
                {children}
            </main>
        </div>
    )
}
