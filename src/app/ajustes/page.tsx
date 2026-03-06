import { Settings } from "lucide-react"

export default function AjustesPage() {
    return (
        <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3"><Settings className="h-8 w-8 text-gray-500" /> Ajustes de Oficina</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Configurações de conta, preferências do painel e definições técnicas.</p>
            </header>

            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <Settings className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4 animate-[spin_4s_linear_infinite]" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Painel de Preferências Brevemente</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Em breve poderá personalizar limites de tolerância para diagnósticos, gerir chaves de API próprias e atualizar palavras-passe.</p>
            </div>
        </div>
    )
}
