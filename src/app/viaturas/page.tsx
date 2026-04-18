import { Car } from "lucide-react"

export default function ViaturasPage() {
    return (
        <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3"><Car className="h-8 w-8 text-blue-500" /> Gestão de Viaturas</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Histórico de veículos analisados pela oficina e cruzamento de matrículas.</p>
            </header>

            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <Car className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Módulo em Desenvolvimento</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Esta secção irá centralizar a folha de obra e o histórico de diagnósticos associado a cada matrícula no futuro.</p>
            </div>
        </div>
    )
}
