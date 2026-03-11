import { prisma } from "@/lib/prisma"
import { Activity, Car, Calendar, Info, Cpu, FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminAnalysesPage() {
    let analyses: any[] = []
    let errorMsg: string | null = null

    try {
        analyses = await prisma.diagnostic.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })
    } catch (error) {
        console.error("Erro ao carregar análises:", error)
        errorMsg = "Houve um problema a ligar à base de dados. Tente novamente."
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-500" />
                    Todas as Análises
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Lista global de todos os diagnósticos gerados pelo sistema, incluindo OBD e Osciloscópio.</p>
            </header>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">Data</th>
                                <th scope="col" className="px-6 py-4">Oficina / Utilizador</th>
                                <th scope="col" className="px-6 py-4">Tipo</th>
                                <th scope="col" className="px-6 py-4">Viatura Identificada</th>
                                <th scope="col" className="px-6 py-4">Diagnóstico</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-950">
                            {analyses.map((analysis) => {
                                const isOscilloscope = analysis.type === 'osciloscopio'
                                return (
                                    <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                <span>{analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString('pt-PT') : '-'}</span>
                                                <span className="text-xs ml-1 opacity-60">
                                                    {analysis.createdAt ? new Date(analysis.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{analysis.user?.name || "Desconhecido"}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5">{analysis.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isOscilloscope ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-500/20">
                                                    <Activity className="h-3 w-3" />
                                                    Onda
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/20">
                                                    <Cpu className="h-3 w-3" />
                                                    OBD
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-200">
                                                <Car className="h-4 w-4 text-gray-400 shrink-0" />
                                                <span className="truncate max-w-[200px]">{analysis.vehicle || "Não identificado"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 max-w-sm">
                                                <FileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2" title={analysis.diagnosis}>
                                                    {analysis.diagnosis}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {errorMsg && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-red-500 font-medium">
                                        {errorMsg}
                                    </td>
                                </tr>
                            )}
                            {!errorMsg && analyses?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        Nenhuma análise registada no sistema.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
