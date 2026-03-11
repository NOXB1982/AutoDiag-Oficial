"use client"

import { useState } from "react"
import { Cpu, Search, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp, LogOut, XCircle, AlertTriangle, Activity } from "lucide-react"
import { CameraUpload, type DiagnosticResult } from "@/components/camera-upload"
import { saveDiagnostic } from "@/app/actions/diagnostics"
import { signOut } from "next-auth/react"

function ParameterRow({ param }: { param: DiagnosticResult['parameters'][0] }) {
    const [isOpen, setIsOpen] = useState(false)

    const StatusIcon =
        param.status === 'error' ? XCircle :
            param.status === 'warning' ? AlertTriangle :
                CheckCircle2;

    const statusColor =
        param.status === 'error' ? 'text-red-600 dark:text-red-500' :
            param.status === 'warning' ? 'text-amber-600 dark:text-amber-500' :
                'text-emerald-600 dark:text-emerald-500';

    return (
        <div className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 gap-3">
                <div className="flex items-start gap-3">
                    <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${statusColor}`} />
                    <div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 block">{param.name}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-gray-900 dark:text-white font-mono font-medium text-sm">{param.value}</span>
                            <span className="text-gray-400 dark:text-gray-500 text-xs text-xs">/</span>
                            <span className="text-gray-500 dark:text-gray-400 font-mono text-xs" title="Valor Ideal">Ideal: {param.idealValue}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-1 text-xs font-medium transition-colors px-3 py-1.5 rounded-full shrink-0 ${isOpen ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                >
                    <Info className="h-3.5 w-3.5" />
                    Detalhes Técnicos
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
            </div>

            {isOpen && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-gray-100 dark:bg-gray-800/80 rounded-lg p-5 text-sm space-y-4 shadow-inner border border-gray-200 dark:border-gray-700">
                        <div>
                            <strong className="block text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1"><Search className="h-3 w-3" /> O que é?</strong>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{param.explanation.whatIsIt}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-800/30">
                            <strong className="block text-blue-900 dark:text-blue-400 mb-1 flex items-center gap-1"><Cpu className="h-3 w-3" /> Significado do Valor (Análise IA)</strong>
                            <p className="text-blue-800 dark:text-blue-300 leading-relaxed font-medium">{param.explanation.meaning}</p>
                        </div>
                        {param.explanation.whatToCheck !== "" && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-100 dark:border-amber-800/30">
                                <strong className="block text-amber-900 dark:text-amber-400 mb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> O que verificar na oficina?</strong>
                                <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">{param.explanation.whatToCheck}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function DashboardClient({ user }: { user: { name?: string | null, email?: string | null, role?: string } }) {
    const [result, setResult] = useState<DiagnosticResult | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [activeType, setActiveType] = useState<"obd" | "osciloscopio" | null>(null)

    const handleResult = async (res: DiagnosticResult) => {
        setResult(res)
        setIsSaving(true)
        try {
            await saveDiagnostic(res.vehicle, res.parameters, res.diagnosis, activeType || "obd")
        } catch (e) {
            console.error(e)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="mx-auto max-w-5xl p-6 lg:p-8 space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        Painel de Diagnóstico
                        <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider">{user.name || user.email}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Bem-vindo ao AutoDiag AI. Fotografe o ecrã do seu scanner OBD2 para análise técnica.
                    </p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                >
                    <LogOut className="h-4 w-4" />
                    Terminar Sessão
                </button>
            </header>

            {!result && !activeType && (
                <div className="grid gap-6 md:grid-cols-3">
                    <button
                        onClick={() => setActiveType("obd")}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 group flex flex-col text-left hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 mb-4 transition-transform group-hover:scale-110">
                            <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Inspeção Visual (Scanner)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Use a câmera do seu dispositivo para captar e limpar reflexos de ecrãs de diagnóstico.</p>
                    </button>

                    <button
                        onClick={() => setActiveType("obd")}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 group flex flex-col text-left hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 mb-4 transition-transform group-hover:scale-110">
                            <Cpu className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Camada de Inteligência IA</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Extração estruturada de parâmetros com explicações técnicas de diagnóstico (Gemini).</p>
                    </button>

                    <button
                        onClick={() => setActiveType("osciloscopio")}
                        className="rounded-xl border border-purple-200 bg-white p-6 shadow-sm dark:border-purple-900/30 dark:bg-gray-900 group relative overflow-hidden flex flex-col text-left hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                    >
                        <div className="absolute -right-12 top-6 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white text-[10px] font-bold px-12 py-1 rotate-45 shadow-sm tracking-wider z-10">
                            ELITE
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 mb-4 transition-transform group-hover:scale-110 relative z-0">
                            <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1 relative z-0">Mestre de Osciloscópio</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 relative z-0">Interpretação IA avançada de formas de onda e sinais elétricos. Capte o sinal do seu osciloscópio.</p>
                    </button>
                </div>
            )}

            {!result && activeType && (
                <div className="space-y-4">
                    <button
                        onClick={() => setActiveType(null)}
                        className="text-sm flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        ← Voltar aos Modos de Diagnóstico
                    </button>
                    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col items-center text-center justify-center min-h-[300px] border-dashed">
                        {activeType === "osciloscopio" ? (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20 mb-2 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping"></div>
                                <Activity className="h-10 w-10 text-purple-600 dark:text-purple-400 relative z-10" />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-2 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
                                <Cpu className="h-10 w-10 text-blue-600 dark:text-blue-400 relative z-10" />
                            </div>
                        )}

                        <CameraUpload onResult={handleResult} type={activeType} />
                    </div>
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            {activeType === "osciloscopio" ? `Onda Entendida: ${result.vehicle}` : `Viatura Entendida: ${result.vehicle}`}
                        </h2>
                        <button
                            onClick={() => {
                                setResult(null)
                                setActiveType(null)
                            }}
                            className="text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg shadow-sm"
                        >
                            Nova Análise OBD
                        </button>
                    </div>

                    {isSaving && <div className="text-sm text-gray-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> A guardar diagnóstico nos registos da oficina...</div>}

                    <div className="grid gap-6 md:grid-cols-3 items-start">
                        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 dark:bg-gray-800/80 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Search className="h-5 w-5 text-blue-500" />
                                    {activeType === 'osciloscopio' ? 'Parâmetros Elétricos e Ondas' : 'Parâmetros Técnicos Captados'}
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {result.parameters?.map((param, idx) => (
                                    <ParameterRow key={idx} param={param} />
                                ))}
                                {(!result.parameters || result.parameters.length === 0) && (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum parâmetro extraído de forma legível. Tente tirar a foto com melhor enquadramento e foco.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10 overflow-hidden shadow-sm sticky top-6">
                            <div className="bg-amber-100 dark:bg-amber-900/30 px-5 py-4 border-b border-amber-200 dark:border-amber-800/40">
                                <h3 className="font-semibold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    {activeType === 'osciloscopio' ? 'Diagnóstico do Circuito / Sensor' : 'Diagnóstico do Motor'}
                                </h3>
                            </div>
                            <div className="p-5 text-amber-950 dark:text-amber-100/90 leading-relaxed text-sm whitespace-pre-wrap">
                                {result.diagnosis}

                                <div className="mt-8 pt-4 border-t border-amber-200/50 dark:border-amber-800/50 flex gap-2 items-start">
                                    <AlertTriangle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400/80 leading-relaxed">
                                        Este relatório é um assistente baseado em IA. Os resultados devem ser validados por um técnico qualificado antes de qualquer intervenção no veículo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <p className="mt-12 pt-8 text-center text-xs font-medium text-gray-400 dark:text-gray-500 max-w-lg mx-auto">
                Versão Beta Privada. O uso desta plataforma é exclusivo para parceiros autorizados e está sujeito a confidencialidade.
            </p>
        </div>
    )
}
