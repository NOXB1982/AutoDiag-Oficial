"use client"

import { useState, useMemo, useEffect } from "react"
import { Cpu, Search, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp, LogOut, XCircle, AlertTriangle, Activity, ArrowLeft, Menu, Plus, Camera, Wrench, Hexagon } from "lucide-react"
import { CameraUpload, type DiagnosticResult } from "@/components/camera-upload"
import { saveDiagnostic } from "@/app/actions/diagnostics"
import { signOut } from "next-auth/react"

// Defines a recorded DB session format
export interface DiagnosticRecord {
    id: string;
    userId: string;
    type: string;
    vehicle: string;
    parameters: string; // JSON string
    diagnosis: string;
    createdAt: Date;
}

function ParameterChart({ value, ideal, status }: { value: number | null, ideal: number | null, status: string }) {
    if (value === null || ideal === null) return null;

    const max = Math.max(value, ideal) * 1.2;
    const valPerc = Math.min((value / max) * 100, 100);
    const idealPerc = Math.min((ideal / max) * 100, 100);

    const barColor = status === 'error' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="mt-4 px-4 pb-4">
            <div className="space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        <span>Lido</span>
                        <span>{value}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-full shadow-sm`} 
                            style={{ width: `${valPerc}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-blue-400 dark:text-blue-500">
                        <span>Ideal</span>
                        <span>{ideal}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-400 dark:bg-blue-600 transition-all duration-1000 ease-out rounded-full opacity-60" 
                            style={{ width: `${idealPerc}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParameterRow({ param }: { param: DiagnosticResult['parameters'][0] }) {
    const [isOpen, setIsOpen] = useState(false)

    const StatusIcon =
        param.status === 'error' ? AlertTriangle :
            param.status === 'warning' ? AlertTriangle :
                CheckCircle2;

    const statusColor =
        param.status === 'error' ? 'text-red-500 animate-pulse' :
            param.status === 'warning' ? 'text-amber-600 dark:text-amber-500' :
                'text-emerald-600 dark:text-emerald-500';

    return (
        <div className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${statusColor}`} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 block">{param.name}</span>
                            {param.status === 'error' && (
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200 dark:border-red-800">
                                    <AlertTriangle className="h-3 w-3" /> ALERTA {">"}15%
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`font-mono font-bold text-base ${param.status === 'error' ? 'text-red-600 dark:text-red-500 text-lg' : 'text-gray-900 dark:text-white'}`}>
                                {param.value}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-xs">/</span>
                            <span className="text-gray-500 dark:text-gray-400 font-mono text-sm" title="Valor Ideal">Ideal: {param.idealValue}</span>
                        </div>
                        {param.status === 'error' && (
                             <p className="text-red-600 dark:text-red-400/90 text-[11px] font-bold mt-1.5 flex items-center gap-1 bg-red-50/50 dark:bg-red-900/10 p-1.5 rounded-lg border border-red-100/50 dark:border-red-800/20">
                                 <Info className="h-3 w-3 shrink-0" /> {param.explanation.meaning.split('\n')[0]}
                             </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center gap-1 text-xs font-bold transition-all px-4 py-2 rounded-lg shrink-0 ${isOpen ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                    >
                        {isOpen ? 'Ocultar' : 'Análise IA'}
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            <ParameterChart value={param.numericValue ?? null} ideal={param.numericIdealValue ?? null} status={param.status} />

            {isOpen && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 text-sm space-y-4 shadow-xl border border-blue-100 dark:border-blue-900/30 ring-1 ring-blue-50/50">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <strong className="block text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider opacity-60"><Search className="h-3 w-3" /> O que é?</strong>
                                <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{param.explanation.whatIsIt}</p>
                            </div>
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <strong className="block text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider"><Cpu className="h-3 w-3" /> Significado Técnico</strong>
                                <p className="text-blue-800 dark:text-blue-200 leading-relaxed font-semibold whitespace-pre-line">{param.explanation.meaning}</p>
                            </div>
                        </div>
                        {param.explanation.whatToCheck !== "" && (
                            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30">
                                <strong className="block text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider"><AlertCircle className="h-3 w-3" /> O que verificar na oficina?</strong>
                                <p className="text-amber-800 dark:text-amber-200 font-bold leading-relaxed whitespace-pre-line">{param.explanation.whatToCheck}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function DashboardClient({ user, initialHistory = [] }: { user: { name?: string | null, email?: string | null, role?: string }, initialHistory?: DiagnosticRecord[] }) {
    const [history, setHistory] = useState<DiagnosticRecord[]>(initialHistory)
    const [result, setResult] = useState<DiagnosticResult | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [activeType, setActiveType] = useState<"obd" | "osciloscopio" | null>(null)
    const [activeSessionVehicle, setActiveSessionVehicle] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAnalyzing) {
            setProgress(0);
            const startTime = Date.now();
            const duration = 3000; // 3 seconds

            timer = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const nextProgress = Math.min((elapsed / duration) * 100, 100);
                setProgress(nextProgress);
                if (nextProgress >= 100) clearInterval(timer);
            }, 50);
        } else {
            setProgress(0);
        }
        return () => clearInterval(timer);
    }, [isAnalyzing]);

    // Compute unique vehicles from history for the Sidebar
    const uniqueVehicles = useMemo(() => {
        const vehicles = new Set(history.map(d => d.vehicle));
        return Array.from(vehicles).sort((a, b) => a.localeCompare(b));
    }, [history]);

    // Compute diagnostics belonging strictly to the active session
    const activeSessionRecords = useMemo(() => {
        if (!activeSessionVehicle) return [];
        return history.filter(d => d.vehicle === activeSessionVehicle);
    }, [history, activeSessionVehicle]);

    const handleResult = async (res: DiagnosticResult) => {
        // VIN-Lock Logic: If a VIN or descriptive vehicle is detected and we aren't in a session, start one
        // We prioritize the descriptive name ('vehicle' field) if a VIN was detected
        if ((res.vin || res.vehicle) && !activeSessionVehicle) {
            const sessionName = res.vehicle || res.vin || "Veículo Desconhecido";
            setActiveSessionVehicle(sessionName);
        }

        const finalVehicleName = activeSessionVehicle || res.vehicle || res.vin || "Veículo Desconhecido";
        
        res.vehicle = finalVehicleName;
        
        // If in session, close camera immediately to show loading/skeleton in the list
        if (activeSessionVehicle) {
            setActiveType(null);
            setIsAnalyzing(true);
        } else {
            setResult(res);
        }
        
        setIsSaving(true)
        
        try {
            const dataResponse = await saveDiagnostic(finalVehicleName, res.parameters, res.diagnosis, activeType || "obd")
            if (dataResponse.success && dataResponse.diagnostic) {
                setHistory(prev => [dataResponse.diagnostic as DiagnosticRecord, ...prev])
                
                // Real-time Update Fix: If in a session, reset activeType and result so we see the history updated
                if (activeSessionVehicle || res.vin) {
                    setActiveType(null);
                    setResult(null);
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsSaving(false)
            setIsAnalyzing(false)
            // Ensure camera closes even on error
            setActiveType(null);
        }
    }

    const openSession = (vehicle: string) => {
        setActiveSessionVehicle(vehicle);
        setResult(null); // Clear single photo mode
        setActiveType(null);
        setIsSidebarOpen(false); // Close mobile drawer
    }

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-gray-50 dark:bg-black">
            
            {/* Mobile Drawer Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Sessões/Veículos) */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 
                transform transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Minha Oficina
                    </h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:bg-gray-100 p-1.5 rounded-md dark:hover:bg-gray-800">
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                        Histórico de Veículos
                    </div>
                    {uniqueVehicles.length === 0 ? (
                        <div className="text-sm text-gray-500 px-2 py-4">Sem diagnósticos. Comece uma nova análise.</div>
                    ) : (
                        uniqueVehicles.map((vehicle) => (
                            <button
                                key={vehicle}
                                onClick={() => openSession(vehicle)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3
                                    ${activeSessionVehicle === vehicle 
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium ring-1 ring-inset ring-blue-600/20' 
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <Search className="h-4 w-4 shrink-0 opacity-70" />
                                <span className="truncate">{vehicle}</span>
                            </button>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                     <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="mx-auto max-w-[1600px] p-4 lg:p-10 space-y-10 pb-32">
                        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between py-2">
                            <div className="flex items-start gap-3">
                                <button 
                                    className="lg:hidden mt-0.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <Menu className="h-7 w-7" />
                                </button>
                                
                                {(activeType || result || activeSessionVehicle) && (
                                    <button
                                        onClick={() => {
                                            setActiveType(null)
                                            setResult(null)
                                            setActiveSessionVehicle(null)
                                        }}
                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        title="Voltar ao Ecrã Inicial"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                )}
                                <div>
                                    <h1 className="text-2xl lg:text-4xl font-black tracking-tight mb-2 flex flex-wrap items-center gap-3 text-gray-900 dark:text-white">
                                        {activeSessionVehicle ? (
                                            <>
                                                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm lg:text-base font-bold animate-pulse shadow-lg shadow-blue-500/20">Sessão Ativa</span>
                                                <span className="text-gray-900 dark:text-white"> Diagnóstico: <span className="text-blue-600 dark:text-blue-400">{activeSessionVehicle}</span></span>
                                            </>
                                        ) : 'Painel de Diagnóstico'}
                                        {!activeSessionVehicle && <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-[10px] lg:text-xs font-mono uppercase tracking-wider hidden sm:inline-block">{user.name || user.email}</span>}
                                    </h1>
                                    <p className="text-base lg:text-lg text-gray-500 dark:text-gray-400 font-medium">
                                        {activeSessionVehicle ? 'Motor VIN-Lock Ativo. Captura de parâmetros contínua habilitada.' : 'Bem-vindo ao AutoDiag AI. Fotografe o VIN ou o ecrã para começar.'}
                                    </p>
                                </div>
                            </div>
                        </header>

            {!result && !activeType && !activeSessionVehicle && (
                <>
                    {/* Unified Loading State replacing the three cards */}
                    {isAnalyzing ? (
                        <div className="space-y-6 pt-2 animate-in fade-in duration-500 max-w-lg mx-auto w-full">
                            <style>{`
                              @keyframes tighten {
                                0%, 100% { transform: rotate(0deg); }
                                50% { transform: rotate(20deg); }
                              }
                              .animate-tighten {
                                animation: tighten 1s ease-in-out infinite;
                              }
                            `}</style>
                            
                            {/* Technical Disclaimer Banner - Positioned above loading */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4 w-full flex items-start gap-4 shadow-sm">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <h4 className="font-bold text-yellow-900 dark:text-yellow-400 text-sm">Aviso de Apoio Técnico</h4>
                                    <p className="text-yellow-800 dark:text-yellow-200/80 text-xs leading-relaxed mt-1">
                                        Este diagnóstico é uma sugestão com base em IA. A decisão final e a reparação são da inteira responsabilidade do técnico qualificado.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                                {/* Wrench and Screw Animation */}
                                <div className="h-28 w-28 relative flex items-center justify-center mb-8">
                                    <Hexagon className="h-14 w-14 text-gray-400 absolute fill-gray-200 dark:fill-gray-800" />
                                    <Wrench className="h-16 w-16 text-blue-600 dark:text-blue-500 absolute -top-2 -right-4 animate-tighten drop-shadow-md" style={{ transformOrigin: '15% 85%' }} />
                                </div>
                                
                                <div className="w-full max-w-sm bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden mb-4">
                                    <div 
                                        className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">A analisar sistemas...</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
                            <button
                                onClick={() => setActiveType("obd")}
                                className="rounded-xl border border-gray-200 bg-white p-5 lg:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 group flex flex-col text-left hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
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
                </>
            )}

            {!result && activeType && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 lg:p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col items-center text-center justify-center min-h-[300px] lg:min-h-[400px] border-dashed">
                        {activeType === "osciloscopio" ? (
                            <div className="flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20 mb-2 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping"></div>
                                <Activity className="h-10 w-10 text-purple-600 dark:text-purple-400 relative z-10" />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-2 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
                                <Cpu className="h-10 w-10 text-blue-600 dark:text-blue-400 relative z-10" />
                            </div>
                        )}

                        <CameraUpload onResult={handleResult} type={activeType} contextVehicle={activeSessionVehicle} />
                    </div>
                </div>
            )}

            {/* Single Capture View (Post-Upload State) */}
            {result && !activeSessionVehicle && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            {activeType === "osciloscopio" ? `Onda: ${result.vehicle}` : `Viatura: ${result.vehicle}`}
                        </h2>
                        <button
                            onClick={() => {
                                // Close result to go back to main screen or session
                                setResult(null)
                                setActiveType(null)
                            }}
                            className="text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg shadow-sm"
                        >
                            Sair da Captura
                        </button>
                    </div>

                    {isSaving && <div className="text-sm text-gray-500 flex items-center gap-2 px-1"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Adicionando à sessão...</div>}

                    <div className="grid gap-8 xl:grid-cols-4 items-start">
                        <div className="xl:col-span-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 overflow-hidden shadow-2xl">
                            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    {activeType === 'osciloscopio' ? 'Análise de Onda' : 'Tabela de Parâmetros'}
                                </h3>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">Real Time</span>
                            </div>
                            <div className="grid sm:grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
                                {result.parameters?.map((param, idx) => (
                                    <ParameterRow key={idx} param={param} />
                                ))}
                                {(!result.parameters || result.parameters.length === 0) && (
                                    <div className="p-10 text-center text-base text-gray-500 dark:text-gray-400 col-span-2">
                                        Nenhum parâmetro legível detetado. Repita a fotografia focando os valores numéricos.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 overflow-hidden shadow-xl sticky top-6">
                            <div className="bg-amber-100 dark:bg-amber-950/40 px-6 py-4 border-b border-amber-200 dark:border-amber-900/20">
                                <h3 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Cpu className="h-4 w-4" />
                                    Conclusão Mestre
                                </h3>
                            </div>
                            <div className="p-6 text-amber-950 dark:text-amber-100/90 leading-relaxed text-base font-medium whitespace-pre-wrap">
                                {result.diagnosis}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Multi-Photo Session View */}
            {activeSessionVehicle && !activeType && (
                <div className="space-y-12 animate-in fade-in max-w-4xl mx-auto">
                    
                    {/* Integrated Capture Card (Same as main menu) */}
                    <div className="grid gap-4 sm:gap-6">
                        <button
                            onClick={() => {
                                setResult(null);
                                setActiveType("obd");
                            }}
                            className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 lg:p-8 shadow-sm dark:border-blue-900/30 dark:bg-blue-900/10 group flex items-center gap-6 text-left hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:bg-white dark:hover:bg-gray-950"
                        >
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-xl lg:text-2xl mb-1 text-gray-900 dark:text-white">Adicionar Parâmetros / Erros</h3>
                                <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 font-medium">Capture e analise novos dados para este veículo.</p>
                            </div>
                            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="h-6 w-6" />
                            </div>
                        </button>
                    </div>

                    {/* Render History from newest to oldest */}
                    {activeSessionRecords.length === 0 && !isAnalyzing && <p className="text-gray-500 text-center py-10">Inicie a análise utilizando o cartão acima.</p>}
                    
                    {/* Analyzing Wrench Loading & Persistent Disclaimer */}
                    {isAnalyzing && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800 animate-in fade-in duration-500">
                            <style>{`
                              @keyframes tighten {
                                0%, 100% { transform: rotate(0deg); }
                                50% { transform: rotate(20deg); }
                              }
                              .animate-tighten {
                                animation: tighten 1s ease-in-out infinite;
                              }
                            `}</style>
                            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
                                
                                {/* Wrench and Screw Animation */}
                                <div className="h-28 w-28 relative flex items-center justify-center mb-8">
                                    <Hexagon className="h-14 w-14 text-gray-400 absolute fill-gray-200 dark:fill-gray-800" />
                                    {/* The transform origin is adjusted so it pivots like a wrench on a nut */}
                                    <Wrench className="h-16 w-16 text-blue-600 dark:text-blue-500 absolute -top-2 -right-4 animate-tighten drop-shadow-md" style={{ transformOrigin: '15% 85%' }} />
                                </div>
                                
                                <div className="w-full max-w-sm bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden mb-4">
                                    <div 
                                        className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">A analisar sistemas...</h3>
                            </div>
                        </div>
                    )}

                    {/* Technical Disclaimer Banner - Persistent across loading and results */}
                    {(activeSessionRecords.length > 0 || isAnalyzing) && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4 w-full flex items-start gap-4 mx-auto max-w-4xl animate-in slide-in-from-top-4 duration-500">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                            <div className="text-left">
                                <h4 className="font-bold text-yellow-900 dark:text-yellow-400 text-sm">Aviso de Apoio Técnico</h4>
                                <p className="text-yellow-800 dark:text-yellow-200/80 text-xs leading-relaxed mt-1">
                                    Este diagnóstico é uma sugestão com base em IA. A decisão final e a reparação são da inteira responsabilidade do técnico qualificado.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {activeSessionRecords.map((record, index) => {
                         let parameters = [];
                         try {
                              parameters = JSON.parse(record.parameters);
                         } catch (e) {
                              console.error("Invalid JSON args in db");
                         }
                         
                         return (
                             <div key={record.id} className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800 first:border-0 first:pt-0">
                                 <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
                                     <Activity className="h-4 w-4" />
                                     Captura de {new Date(record.createdAt).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} 
                                     <span className="opacity-50 mx-1">/</span>
                                     <span className="uppercase tracking-wider text-[10px] bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">{record.type}</span>
                                 </div>
                                 <div className="grid gap-8 xl:grid-cols-4 items-start">
                                     <div className="xl:col-span-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 overflow-hidden shadow-lg">
                                         <div className="grid sm:grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
                                             {parameters.map((param: any, idx: number) => (
                                                 <ParameterRow key={idx} param={param} />
                                             ))}
                                         </div>
                                     </div>
                                     <div className="rounded-2xl border border-amber-100 bg-amber-50/30 dark:border-amber-900/20 dark:bg-amber-900/5 overflow-hidden">
                                         <div className="bg-amber-100/50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-800/30">
                                             <h3 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2 text-xs uppercase">
                                                 <AlertCircle className="h-3.5 w-3.5" /> Análise IA
                                             </h3>
                                         </div>
                                         <div className="p-4 text-amber-900/80 dark:text-amber-200/70 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                                             {record.diagnosis}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         )
                    })}
                </div>
            )}

            <p className="mt-8 pt-8 pb-8 text-center text-[10px] lg:text-xs font-medium text-gray-400 dark:text-gray-600 max-w-lg mx-auto">
                AutoDiag AI. Uso exclusivo como ferramenta de apoio ao diagnóstico. A decisão técnica é da responsabilidade do mecânico.
            </p>
                    </div>
                </div>

                {/* Floating Add Button in Active Session */}
                {activeSessionVehicle && !activeType && (
                    <div className="absolute bottom-8 right-8 lg:bottom-12 lg:right-12 z-30">
                        <button
                            onClick={() => {
                                setResult(null); // Clear previous result view if any
                                setActiveType("obd");
                            }} 
                            className="flex items-center gap-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 shadow-2xl shadow-blue-500/40 hover:-translate-y-2 transition-all duration-300 font-black group active:scale-95 border-2 border-blue-500/20"
                            title="Nova Captura de Parâmetros"
                        >
                            <div className="relative">
                                <Camera className="h-7 w-7 transition-transform group-hover:scale-110" />
                                <div className="absolute -top-1.5 -right-1.5 bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[12px] font-black border-2 border-blue-600 shadow-md">
                                    +
                                </div>
                            </div>
                            <span className="hidden sm:inline text-xl tracking-tight">Nova Captura</span>
                            <span className="sm:hidden text-lg">Capturar</span>
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}
