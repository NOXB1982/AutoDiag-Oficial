import { prisma } from "@/lib/prisma"
import { Car, Hash, Calendar, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminVehiclesPage() {
    // Busca agrupada das viaturas usando count
    const vehicleStats = await prisma.diagnostic.groupBy({
        by: ['vehicle'],
        _count: {
            id: true
        },
        _max: {
            createdAt: true
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        }
    })

    const totalUniqueVehicles = vehicleStats.filter(v => v.vehicle && v.vehicle.trim() !== "" && v.vehicle !== "Veículo não especificado").length

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <Car className="h-6 w-6 text-emerald-500" />
                    Global de Viaturas
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Resumo dos veículos intervencionados pela plataforma, ordenados pela regularidade de diagnósticos.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 mb-6">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 col-span-1 md:col-span-1">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Entendido Único</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUniqueVehicles}</p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">Viatura Extraída / Identidade</th>
                                <th scope="col" className="px-6 py-4 text-center">Nº de Apelidamentos</th>
                                <th scope="col" className="px-6 py-4 text-center">Última Análise</th>
                                <th scope="col" className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-950">
                            {vehicleStats.map((stat, idx) => {
                                const isValid = stat.vehicle && stat.vehicle.trim() !== "" && stat.vehicle !== "Veículo não especificado"
                                if (!isValid) return null

                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                                                <Car className="h-5 w-5" />
                                            </div>
                                            {stat.vehicle}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-500/20">
                                                <Hash className="h-3.5 w-3.5" />
                                                {stat._count.id}x
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                {stat._max.createdAt ? new Date(stat._max.createdAt).toLocaleDateString('pt-PT') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-blue-500 transition-colors">
                                                <ArrowRight className="h-5 w-5 ml-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
