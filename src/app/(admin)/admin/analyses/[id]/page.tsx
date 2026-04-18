import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { DiagnosticTableView } from "@/components/dashboard-client"
import { DiagnosticResult } from "@/components/camera-upload"
import { Car, Calendar, Cpu, Activity, User, EyeOff, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AdminAnalysisDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const analysis = await prisma.diagnostic.findUnique({
        where: { id: id },
        include: { user: true }
    })

    if (!analysis) return notFound()

    let parsedResult: DiagnosticResult | null = null
    try {
        parsedResult = JSON.parse(analysis.parameters) as DiagnosticResult
    } catch {
        // failed parse
    }

    const isOscilloscope = analysis.type === 'osciloscopio'

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/admin/analyses" className="inline-flex items-center justify-center p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors mr-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        {isOscilloscope ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-500/20">
                                <Activity className="h-3 w-3" /> Onda Osciloscópio
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/20">
                                <Cpu className="h-3 w-3" /> Scanner OBD
                            </span>
                        )}
                        <span className="text-gray-400 dark:text-gray-500 text-sm font-mono tracking-wider ml-2">#{analysis.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <Car className="h-6 w-6 text-gray-400" />
                        {analysis.vehicle || "Viatura Indeterminada"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {new Date(analysis.createdAt).toLocaleString('pt-PT')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            Oficina: <span className="text-gray-900 dark:text-gray-200 font-bold">{analysis.user.name}</span>
                        </span>
                    </div>
                </div>
            </header>

            {/* The Layout: Split Screen */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                
                {/* Imagem Original */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Camera className="h-4 w-4 text-gray-500" /> Fotografia do Scanner / Máquina
                        </h3>
                    </div>
                    {analysis.image ? (
                        <div className="relative w-full bg-black/5 dark:bg-black/20 flex items-center justify-center p-6 min-h-[400px]">
                            <img 
                                src={analysis.image} 
                                alt="Diagnóstico" 
                                className="max-w-full max-h-[800px] object-contain rounded-lg shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 px-6 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4 ring-8 ring-white dark:ring-gray-900 shadow-sm">
                                <EyeOff className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="font-bold text-lg text-gray-900 dark:text-gray-200 mb-2 tracking-tight">Sem Imagem Histórica</p>
                            <p className="text-sm max-w-md leading-relaxed">Este diagnóstico ocorreu numa versão anterior da plataforma OBD onde os dados fotográficos brutos não persistiam nos servidores Neon Postgres para conservação de discos na framework DB.</p>
                        </div>
                    )}
                </div>

                {/* Dados Espelhados da IA (Componente Nativo Cliente) */}
                <div className="flex flex-col gap-6 w-full">
                    {parsedResult ? (
                        <DiagnosticTableView result={{...parsedResult, vehicle: analysis.vehicle, diagnosis: analysis.diagnosis}} />
                    ) : (
                        <div className="p-8 text-center text-red-700 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/50 font-medium">
                            Falha ao descodificar os parâmetros JSON do servidor Prisma.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
