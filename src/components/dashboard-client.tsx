"use client"

import React, { useState, useMemo, useEffect, Fragment, useRef } from "react"
import { Cpu, Search, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp, LogOut, XCircle, AlertTriangle, Activity, ArrowLeft, Menu, Plus, Camera, Wrench, Hexagon, FileText, HelpCircle, Loader2 } from "lucide-react"
import { CameraUpload, type DiagnosticResult } from "@/components/camera-upload"
import { saveDiagnostic } from "@/app/actions/diagnostics"
import { lookupVinDb, saveVinDb, decodeVinAi } from "@/app/actions/vin-decoder"
import { extractVinFromImage } from "@/app/actions/vin-image"
import { signOut } from "next-auth/react"
import { DiagnosticChat } from "@/components/diagnostic-chat"
import dynamic from "next/dynamic"
const TechnicalDocCard = dynamic(() => import("@/components/technical-doc-card").then(mod => mod.TechnicalDocCard), { ssr: false })
import { VisualInspectionModule } from "@/components/visual-inspection-module"
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

export function DiagnosticTableView({ result }: { result: DiagnosticResult }) {
    const [expandedParam, setExpandedParam] = useState<number | null>(null);
    const [expandedDtc, setExpandedDtc] = useState<number | null>(null);
    const [isResumoExpanded, setIsResumoExpanded] = useState<boolean>(false);

    return (
        <div className="grid gap-6 xl:grid-cols-3 items-start w-full">
            <div className="xl:col-span-1 border border-gray-200 rounded-xl bg-white shadow-sm dark:bg-gray-950 dark:border-gray-800 p-5">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4 text-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500" /> Códigos de Erro (DTC)
                </h3>
                {result.dtcs && result.dtcs.length > 0 ? (
                    <ul className="space-y-3">
                        {result.dtcs.map((dtc, idx) => (
                            <li key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-red-500/50">
                                <button 
                                    onClick={() => setExpandedDtc(expandedDtc === idx ? null : idx)}
                                    className="w-full text-left p-3.5 flex items-center justify-between gap-4 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <strong className="font-black font-mono text-base sm:text-lg text-red-700 dark:text-red-400 flex items-center gap-2 drop-shadow-sm">
                                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                        {dtc.code}
                                    </strong>
                                    {expandedDtc === idx ? <ChevronUp className="h-5 w-5 text-red-500 shrink-0" /> : <ChevronDown className="h-5 w-5 text-red-500 shrink-0" />}
                                </button>
                                {expandedDtc === idx && (
                                    <div className="p-4 pt-0 text-sm text-red-900 dark:text-red-100 font-medium leading-relaxed border-t border-red-100 dark:border-red-800/50 bg-white/50 dark:bg-black/20">
                                        <p className="mb-3">{dtc.description}</p>
                                        
                                        {dtc.probableCauses && (
                                            <div className="mt-4 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg">
                                                <strong className="text-red-800 dark:text-red-400 block mb-1 text-xs uppercase tracking-wider">Causas Prováveis:</strong>
                                                <p className="text-red-900 dark:text-red-200">{dtc.probableCauses}</p>
                                            </div>
                                        )}
                                        {dtc.symptoms && (
                                            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-lg">
                                                <strong className="text-orange-800 dark:text-orange-400 block mb-1 text-xs uppercase tracking-wider">Sintomas Comuns:</strong>
                                                <p className="text-orange-900 dark:text-orange-200">{dtc.symptoms}</p>
                                            </div>
                                        )}
                                        {dtc.howToTest && (
                                            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl relative overflow-hidden group transition-all shadow-sm">
                                                <div className="absolute -top-2 -right-2 p-2 opacity-[0.04] dark:opacity-10 group-hover:opacity-10 transition-opacity pointer-events-none">
                                                    <Wrench className="w-16 h-16 text-emerald-900 dark:text-emerald-400" />
                                                </div>
                                                <strong className="text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-wider font-extrabold relative z-10">
                                                    <Activity className="h-3.5 w-3.5" /> COMO TESTAR ESTE COMPONENTE
                                                </strong>
                                                <p className="text-emerald-900 dark:text-emerald-100 text-[13px] font-medium leading-relaxed relative z-10 whitespace-pre-wrap">
                                                    {dtc.howToTest.split(': ').map((segment, i) => i === 0 && dtc.howToTest!.includes(': ') ? <span key={i} className="font-bold">{segment}: </span> : segment)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">Nenhum código de erro (DTC) detetado na imagem.</p>
                )}

                <div className="mt-8 border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden bg-blue-50/50 dark:bg-blue-900/10 transition-all shadow-sm">
                    <button 
                        onClick={() => setIsResumoExpanded(!isResumoExpanded)}
                        className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 text-base">
                            <Activity className="h-5 w-5 text-blue-500" /> Resumo Global
                        </h3>
                        {isResumoExpanded ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5 text-blue-500" />}
                    </button>
                    {isResumoExpanded && (
                        <div className="p-4 pt-0 text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium border-t border-blue-100 dark:border-blue-800/50 bg-white/50 dark:bg-black/20">
                            {result.diagnosis || "Sistemas analisados conformes os dados apresentados."}
                        </div>
                    )}
                </div>
            </div>

            <div className="xl:col-span-2 border border-gray-200 rounded-xl bg-white shadow-sm dark:bg-gray-950 dark:border-gray-800 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base uppercase tracking-wider">
                        <Cpu className="h-4 w-4 text-gray-400" />
                        Parâmetros em Tempo Real
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm md:table flex flex-col block">
                        <thead className="hidden md:table-header-group bg-gray-50/50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-5 py-3 font-semibold uppercase text-xs tracking-wider">Componente Analisado</th>
                                <th className="px-5 py-3 font-semibold uppercase text-xs tracking-wider border-l border-gray-200 dark:border-gray-800">Lido (Câmara)</th>
                                <th className="px-5 py-3 font-semibold uppercase text-xs tracking-wider border-l border-gray-200 dark:border-gray-800">Referência (Original)</th>
                                <th className="px-5 py-3 font-semibold uppercase text-xs tracking-wider border-l border-gray-200 dark:border-gray-800 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 md:table-row-group flex flex-col w-full block">
                            {result.parameters?.map((p, idx) => (
                                <Fragment key={idx}>
                                <tr className={`${p.status === 'error' ? 'bg-red-50/10 dark:bg-red-900/5' : p.status === 'warning' ? 'bg-orange-50/20 dark:bg-orange-900/5' : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'} transition-colors md:table-row flex flex-col border-b border-gray-100 dark:border-gray-800 md:border-b-0 relative`}>
                                    
                                    {/* Mobile Floating Badge Status */}
                                    <div className="absolute right-4 top-4 md:hidden">
                                        {p.status === 'error' ? (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                <AlertTriangle className="h-3 w-3" /> Erro
                                            </span>
                                        ) : p.status === 'warning' ? (
                                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                <AlertCircle className="h-3 w-3" /> Anomalia
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                <CheckCircle2 className="h-3 w-3" /> OK
                                            </span>
                                        )}
                                    </div>

                                    <td className="px-5 pt-4 pb-2 md:py-4 md:w-1/3 md:table-cell block w-full">
                                        <div className="font-bold text-gray-900 dark:text-gray-100 whitespace-normal flex flex-wrap items-center gap-2 max-w-[260px] md:max-w-xs pr-16 md:pr-0 text-base md:text-sm">
                                            <span>{p.name}</span>
                                            <button 
                                                onClick={() => setExpandedParam(expandedParam === idx ? null : idx)}
                                                className={`p-1.5 rounded-full transition-colors ${expandedParam === idx ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                title="Saber Mais sobre a Leitura"
                                            >
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-blue-700 dark:text-blue-400 mt-2 font-medium leading-relaxed whitespace-normal rounded-md bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 border border-blue-100 dark:border-blue-900/50 inline-block shadow-sm">
                                            {p.explanation.whatIsIt}
                                        </div>
                                    </td>
                                    
                                    {/* Val Mobile Stacking */}
                                    <td className="px-5 py-3 md:py-4 flex flex-col md:table-cell border-t border-gray-100/50 md:border-t-0 md:border-l dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 md:bg-transparent">
                                        <div className="flex justify-between items-center md:hidden mb-1">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lido na Câmara</span>
                                            <span className={`font-mono text-lg font-black tracking-tight drop-shadow-sm ${p.status === 'error' ? 'text-red-600 dark:text-red-400 scale-105 transform origin-right' : p.status === 'warning' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {p.value}
                                            </span>
                                        </div>
                                        
                                        {/* Desktop Only Lido */}
                                        <div className={`hidden md:block font-mono font-black text-base drop-shadow-sm ${p.status === 'error' ? 'text-red-600 dark:text-red-400 scale-105 transform origin-left' : p.status === 'warning' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {p.value}
                                        </div>

                                        <div className="flex justify-between items-center md:hidden mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 border-dashed">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Referência Original</span>
                                            <span className="font-mono text-xs text-gray-600 dark:text-gray-400 font-medium bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                                                {p.idealValue}
                                            </span>
                                        </div>
                                    </td>
                                    
                                    {/* Desktop Only Ideal */}
                                    <td className="hidden md:table-cell px-5 py-4 font-mono text-gray-500 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800 text-sm">
                                        {p.idealValue}
                                    </td>
                                    
                                    {/* Desktop Only Status */}
                                    <td className="hidden md:table-cell px-5 py-4 border-l border-gray-100 dark:border-gray-800 text-center">
                                        {p.status === 'error' ? (
                                            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                <AlertTriangle className="h-3.5 w-3.5" /> Erro
                                            </span>
                                        ) : p.status === 'warning' ? (
                                            <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                <AlertCircle className="h-3.5 w-3.5" /> Anomalia
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold text-[10px] uppercase tracking-wider py-1.5">
                                                <CheckCircle2 className="h-4 w-4" /> OK
                                            </span>
                                        )}
                                    </td>
                                </tr>
                                
                                {/* Painel Expandido de Dicionário Técnico */}
                                {expandedParam === idx && (
                                    <tr className="bg-blue-50/40 dark:bg-blue-900/10 xl:border-b-0 border-b border-gray-100 dark:border-gray-800 md:table-row flex flex-col block w-full">
                                        <td colSpan={4} className="px-6 py-5">
                                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                                <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-xl shrink-0 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                                                    <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    {/* Alerta de Causa Provável (O Porquê) */}
                                                    {p.explanation.probableCause && (p.status === 'warning' || p.status === 'error') && (
                                                        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-6 mt-1 w-full">
                                                            <strong className="text-red-800 dark:text-red-400 text-sm font-black flex items-center gap-2">
                                                                <AlertTriangle className="h-4 w-4" /> O Culpado (Porquê?)
                                                            </strong>
                                                            <p className="text-red-900 dark:text-red-200 mt-2 text-sm font-semibold leading-relaxed">
                                                                🚨 Este valor está fora do normal porque muito provavelmente {p.explanation.probableCause.replace(/^(existe|o|a|os|as)\s/i, '$1 ')}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                                        <div className="space-y-1.5">
                                                            <strong className="text-blue-900 dark:text-blue-400 text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                                                Dica do Mestre (Leitura)
                                                            </strong>
                                                            <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed font-medium bg-blue-50/50 dark:bg-blue-900/20 rounded px-2 py-1 border-l-2 border-blue-400">
                                                                {p.explanation.meaning}
                                                            </p>
                                                        </div>
                                                        
                                                        {(p.explanation.highSymptom || p.explanation.symptoms) && (
                                                            <div className="space-y-1.5">
                                                                <strong className="text-orange-700 dark:text-orange-500 text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                                                    Sintoma (Se Alto)
                                                                </strong>
                                                                <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed font-medium">
                                                                    {p.explanation.highSymptom || p.explanation.symptoms}
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        {(p.explanation.lowSymptom || p.explanation.checkNext) && (
                                                            <div className="space-y-1.5">
                                                                <strong className="text-blue-700 dark:text-blue-500 text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                                                    Sintoma (Se Baixo)
                                                                </strong>
                                                                <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed font-medium">
                                                                    {p.explanation.lowSymptom || p.explanation.checkNext}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                    {(!result.parameters || result.parameters.length === 0) && (
                        <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            Nenhum parâmetro numérico legível na imagem submetida.
                        </div>
                    )}
                </div>
                
                {/* Physical Verification Block */}
                {result.nextSteps && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-200/60 dark:border-emerald-900/50 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start transition-all">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-2xl shrink-0 shadow-sm border border-emerald-200 dark:border-emerald-800/80">
                            <Wrench className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-emerald-900 dark:text-emerald-300 font-extrabold text-lg mb-2 flex items-center gap-2 tracking-tight">
                                O Que Medir Agora (Guia Físico)
                            </h4>
                            <p className="text-emerald-800 dark:text-emerald-400/90 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                                {result.nextSteps}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export function DashboardClient({ user, initialHistory = [] }: { user: { name?: string | null, email?: string | null, role?: string }, initialHistory?: DiagnosticRecord[] }) {
    const [history, setHistory] = useState<DiagnosticRecord[]>(initialHistory)
    const [result, setResult] = useState<DiagnosticResult | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [activeType, setActiveType] = useState<"obd" | "visual" | "osciloscopio" | "doc" | null>(null)
    const [activeSessionVehicle, setActiveSessionVehicle] = useState<string | null>(null)
    const [vehicleForm, setVehicleForm] = useState({ marca: "", modelo: "", ano: "", motor: "" })
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [progress, setProgress] = useState(0)
    
    // Camera references for VIN scanning
    const vinFileInputRef = useRef<HTMLInputElement>(null);
    const [isScanningVin, setIsScanningVin] = useState(false);
    
    // VIN Auto-Fill States
    const [vinInput, setVinInput] = useState("")
    const [isDecodingVin, setIsDecodingVin] = useState(false)
    const [vinError, setVinError] = useState<string | null>(null)
    const [isAiSuggested, setIsAiSuggested] = useState(false)

    const handleDecodeVin = async () => {
        if (!vinInput || vinInput.length < 10) {
            setVinError("Chassi inválido. Insira um VIN válido (mín. 10 chars).")
            return;
        }
        setIsDecodingVin(true)
        setVinError(null)
        setIsAiSuggested(false)

        try {
            // STEP 1: Cached Verification
            const cachedVin = await lookupVinDb(vinInput);
            if (cachedVin) {
                setVehicleForm(prev => ({
                    ...prev,
                    marca: cachedVin.marca || prev.marca,
                    modelo: cachedVin.modelo || prev.modelo,
                    ano: cachedVin.ano || prev.ano,
                    motor: cachedVin.motor || prev.motor
                }));
                setIsDecodingVin(false);
                return;
            }

            // Temporarily set animated loading text for UX
            setVehicleForm(prev => ({
                marca: "A investigar NHTSA...",
                modelo: "A aguardar...",
                ano: "A aguardar...",
                motor: prev.motor
            }));

            // STEP 2: NHTSA Extraction with 3s Timeout
            let make = null, model = null, year = null, errorCode = null;
            let nhtsaSuccess = false;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vinInput}?format=json`, { signal: controller.signal })
                clearTimeout(timeoutId);
                
                const data = await res.json()
                if (data && data.Results) {
                    const getVal = (id: number) => {
                        const item = data.Results.find((r: any) => r.VariableId === id)
                        return item && item.Value && item.Value !== "Not Applicable" ? item.Value : null
                    }
                    make = getVal(26); model = getVal(28); year = getVal(29); errorCode = getVal(39);
                    
                    if (errorCode === "0" && make && make !== "null" && year) {
                        nhtsaSuccess = true;
                    }
                }
            } catch (err) {
                // Fetch aborted (timeout) or general network error
                nhtsaSuccess = false;
            }
                
            if (!nhtsaSuccess) {
                // STEP 3: Fallback Inference Gemini
                setVehicleForm(prev => ({
                    ...prev,
                    marca: "A identificar via IA...",
                    modelo: "A deduzir Chassis...",
                    ano: "A calcular..."
                }));
                
                const aiResult = await decodeVinAi(vinInput);
                if (aiResult && aiResult.marca) {
                    setVehicleForm(prev => ({
                        ...prev,
                        marca: aiResult.marca || prev.marca,
                        modelo: aiResult.modelo || prev.modelo,
                        ano: aiResult.ano || prev.ano,
                        motor: aiResult.motor || prev.motor
                    }));
                    setIsAiSuggested(true);
                } else {
                    setVinError("Chassi não reconhecido e Fallback falhou. Por favor, preencha manualmente.")
                    setVehicleForm(prev => ({ ...prev, marca: "", modelo: "", ano: "" }))
                }
            } else {
                setVehicleForm(prev => ({
                    ...prev,
                    marca: String(make),
                    modelo: String(model),
                    ano: String(year)
                }))
            }
        } catch (error) {
            setVinError("Erro de ligação. Preencha os dados manualmente.")
            setVehicleForm(prev => ({ ...prev, marca: "", modelo: "", ano: "" }))
        } finally {
            setIsDecodingVin(false)
        }
    }

    useEffect(() => {
        if (vinInput && vinInput.length === 17 && !isDecodingVin && !vinError) {
            // Auto decoding trigger
            handleDecodeVin();
        }
    }, [vinInput])

    const handleVinCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanningVin(true);
        setVinError(null);
        setVehicleForm(prev => ({ ...prev, marca: "A analisar a imagem...", modelo: "Por favor", ano: "aguarde" }));

        try {
            const formData = new FormData();
            formData.append("file", file);

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const result = await extractVinFromImage(base64);

                if (result.success && result.vin) {
                    setVinInput(result.vin); // This will then trigger useEffect auto-decode because it's 17 length
                } else {
                    setVinError("Não foi possível ler o Chassis na fotografia. " + (result.error || ""));
                    setVehicleForm(prev => ({ ...prev, marca: "", modelo: "", ano: "" }));
                }
                setIsScanningVin(false);
                if (vinFileInputRef.current) vinFileInputRef.current.value = "";
            };
            reader.onerror = () => {
                setVinError("Erro ao processar imagem.");
                setIsScanningVin(false);
            };
        } catch (e) {
            setVinError("Erro inesperado na leitura da fotografia.");
            setIsScanningVin(false);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAnalyzing) {
            setProgress(0);
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) return 100;
                    if (prev < 90) {
                        return Math.min(prev + 2, 90);
                    } else if (prev < 99) {
                        return Math.min(prev + 0.1, 99);
                    }
                    return prev;
                });
            }, 200);
        } else {
            setProgress(0);
        }
        return () => clearInterval(timer);
    }, [isAnalyzing]);

    // Compute unique vehicles from history for the Sidebar
    const uniqueVehicles = useMemo(() => {
        if (!history || !Array.isArray(history)) return [];
        const vehicles = new Set(history.map(d => d?.vehicle).filter(Boolean));
        return Array.from(vehicles).sort((a, b) => String(a).localeCompare(String(b)));
    }, [history]);

    // Compute diagnostics belonging strictly to the active session
    const activeSessionRecords = useMemo(() => {
        if (!activeSessionVehicle) return [];
        return history.filter(d => d.vehicle === activeSessionVehicle);
    }, [history, activeSessionVehicle]);

    const handleResult = async (res: DiagnosticResult, base64Image?: string) => {
        // Obsolete VIN-Lock Logic: Vehicle ID is now forcefully injected by the mechanic.
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
            const snapshotResult = { dtcs: res.dtcs, parameters: res.parameters };
            const dataResponse = await saveDiagnostic(finalVehicleName, snapshotResult, res.diagnosis, activeType || "obd", base64Image || null)
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
            setProgress(100)
            setTimeout(() => {
                setIsAnalyzing(false)
                // Ensure camera closes even on error
                setActiveType(null);
            }, 500)
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
                
                {/* Global Beta Banner */}
                <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white text-center py-2 px-4 shadow-sm z-30 text-xs font-bold tracking-wide flex items-center justify-center gap-2 uppercase">
                     <AlertCircle className="h-3.5 w-3.5" /> AutoDiag IA Versão Beta. O uso é exclusivo para fins informativos e confidenciais.
                </div>
                
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
                                            if (!activeType && !result) {
                                                setActiveSessionVehicle(null);
                                                setVehicleForm({ marca: "", modelo: "", ano: "", motor: "" });
                                            }
                                        }}
                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        title={(!activeType && !result) ? "Limpar Veículo e Voltar" : "Voltar Atrás"}
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

            {/* Unified Loading State Universally Rendered */}
            {isAnalyzing && (
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
            )}

            <div className={isAnalyzing ? "hidden" : "space-y-10 w-full"}>
                
                {/* Vehicle Identity Form (Shown if no active session vehicle) */}
                {!activeSessionVehicle && !result && !activeType && (
                    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 p-6 sm:p-8 flex sm:items-center flex-col sm:flex-row gap-5 text-white">
                            <div className="bg-white/20 p-3.5 rounded-2xl border border-white/20 shadow-inner shrink-0 self-start sm:self-center">
                                <Activity className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-2 drop-shadow-sm">
                                    <CheckCircle2 className="h-5 w-5 opacity-70" /> Trancar Identidade do Veículo
                                </h2>
                                <p className="text-indigo-100/90 text-[13px] sm:text-sm font-medium mt-1.5 leading-relaxed max-w-lg">
                                    Evite respostas genéricas da IA. Preencha rigorosamente a marca, modelo e código de motor para forçar o especialista virtual a aceder apenas aos relatórios e parâmetros deste veículo exato.
                                </p>
                            </div>
                        </div>

                        <form 
                            className="p-6 sm:p-8 space-y-6"
                            onSubmit={async (e) => {
                                e.preventDefault()
                                if(vehicleForm.marca && vehicleForm.modelo && vehicleForm.ano && vehicleForm.motor) {
                                    if(vinInput && vinInput.length === 17) {
                                        await saveVinDb({
                                            vin: vinInput,
                                            marca: vehicleForm.marca,
                                            modelo: vehicleForm.modelo,
                                            ano: vehicleForm.ano,
                                            motor: vehicleForm.motor
                                        });
                                    }
                                    setActiveSessionVehicle(`CONTEXTO: Carro com VIN ${vinInput || 'Indisponível'}, ${vehicleForm.marca}, ${vehicleForm.modelo}, ${vehicleForm.ano}, Motor: ${vehicleForm.motor}`)
                                }
                            }}
                        >
                            {/* VIN Auto-Decoder Field */}
                            <div className="mb-8 w-full bg-blue-50/50 dark:bg-blue-900/10 p-5 sm:p-6 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                                <label className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest block mb-4 flex items-center gap-2">
                                    <Search className="h-5 w-5"/> Inserir Chassi (VIN) Prioritário
                                </label>
                                <div className="flex flex-col sm:flex-row gap-4 mb-3">
                                    <input 
                                        type="text" 
                                        placeholder="Ex: WVWZZZ1KZ5..." 
                                        value={vinInput} 
                                        onChange={e => {
                                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
                                            setVinInput(val);
                                            if (val.length < 17) setVinError(null);
                                        }} 
                                        className="flex-1 bg-white dark:bg-gray-950 border-2 border-blue-200 dark:border-blue-800/60 rounded-xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/20 font-black text-xl tracking-widest transition-all shadow-inner uppercase text-gray-900 dark:text-white"
                                        maxLength={17}
                                    />
                                    <div className="flex shrink-0 gap-2">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment" 
                                            className="hidden" 
                                            ref={vinFileInputRef}
                                            onChange={handleVinCapture}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => vinFileInputRef.current?.click()}
                                            disabled={isDecodingVin || isScanningVin}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-md active:scale-95"
                                            title="Tirar foto ao Nº Chassis"
                                        >
                                            {isScanningVin ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleDecodeVin}
                                            disabled={isDecodingVin || !vinInput || vinInput.length !== 17 || isScanningVin}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2 whitespace-nowrap shadow-md text-lg active:scale-95"
                                        >
                                            {isDecodingVin ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                            <span className="hidden sm:inline">{isDecodingVin ? "A procurar..." : "Verificar"}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${vinInput.length === 17 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                        {vinInput.length}/17 Dígitos
                                    </span>
                                    {vinError && (
                                        <p className="text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-1.5 animate-in slide-in-from-left-2">
                                            <AlertTriangle className="h-4 w-4" /> {vinError}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {isAiSuggested && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 p-4 -mt-2 mb-2 rounded-r-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                    <span>Dados sugeridos pela IA (Gemini Pro). Confirme o Código no veículo.</span>
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Marca</label>
                                    <input required type="text" placeholder="Ex: Volkswagen" value={vehicleForm.marca} onChange={e => setVehicleForm({...vehicleForm, marca: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 font-medium transition-shadow ${isAiSuggested ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 focus:ring-yellow-500 text-yellow-900 dark:text-yellow-100' : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 focus:ring-indigo-500'}`}/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Modelo</label>
                                    <input required type="text" placeholder="Ex: Golf V" value={vehicleForm.modelo} onChange={e => setVehicleForm({...vehicleForm, modelo: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 font-medium transition-shadow ${isAiSuggested ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 focus:ring-yellow-500 text-yellow-900 dark:text-yellow-100' : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 focus:ring-indigo-500'}`}/>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ano</label>
                                    <input required type="text" placeholder="Ex: 2004" value={vehicleForm.ano} onChange={e => setVehicleForm({...vehicleForm, ano: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 font-medium transition-shadow ${isAiSuggested ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 focus:ring-yellow-500 text-yellow-900 dark:text-yellow-100' : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 focus:ring-indigo-500'}`}/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 flex justify-between uppercase tracking-wider">
                                        <span>Cód. Motor / Sistema</span> <span className="text-red-500">*Crucial</span>
                                    </label>
                                    <input required type="text" placeholder="Ex: AZD (Motor) ou ABS MK60" value={vehicleForm.motor} onChange={e => setVehicleForm({...vehicleForm, motor: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 font-medium transition-shadow ${isAiSuggested ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 focus:ring-yellow-500 text-yellow-900 dark:text-yellow-100' : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 focus:ring-indigo-500'}`}/>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-wide text-lg sm:text-xl rounded-xl py-4 sm:py-5 shadow-xl shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-6 w-6" /> CARREGAR PERFIL DE DIAGNÓSTICO
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeSessionVehicle && !result && !activeType && (
                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2">
                        {/* Cartão 0: Scanner OBD Clássico */}
                        <button
                            onClick={() => setActiveType("obd")}
                            className="rounded-2xl border-2 border-dashed border-sky-200 bg-white p-6 lg:p-8 shadow-sm dark:border-sky-900/30 dark:bg-gray-900 group flex flex-col items-center justify-center text-center hover:border-sky-500 dark:hover:border-sky-500 transition-colors"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30 mb-4 transition-transform group-hover:scale-110">
                                <Search className="h-7 w-7 text-sky-600 dark:text-sky-400" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Scanner OBD</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Diagnóstico de Erros (DTCs) e Tabela Numérica Real.</p>
                        </button>
                        {/* Cartão 1: Scanner OBD Fundido */}
                        <button
                            onClick={() => setActiveType("visual")}
                            className="rounded-2xl border-2 border-dashed border-blue-200 bg-white p-6 lg:p-8 shadow-sm dark:border-blue-900/30 dark:bg-gray-900 group flex flex-col items-center justify-center text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4 transition-transform group-hover:scale-110">
                                <Search className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Identificação Visual</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Tira fotografia a módulos físicos para gerar mapa de pinos via IA.</p>
                        </button>

                        {/* Cartão 2: Documentação Técnica (Pausado / Ocultado) */}
                        {/* 
                        <button
                            onClick={() => setActiveType("doc")}
                            className="rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-6 lg:p-8 shadow-sm dark:border-indigo-900/30 dark:bg-gray-900 group flex flex-col items-center justify-center text-center hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 mb-4 transition-transform group-hover:scale-110">
                                <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Esquemas Elétricos</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Módulo de extração de Pinagem de ECUs e Manuais via P&R.</p>
                        </button>
                        */}

                        {/* Cartão 3: Osciloscópio */}
                        <button
                            onClick={() => setActiveType("osciloscopio")}
                            className="rounded-2xl border-2 border-dashed border-purple-200 bg-white p-6 lg:p-8 shadow-sm dark:border-purple-900/30 dark:bg-gray-900 group relative overflow-hidden flex flex-col items-center justify-center text-center hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                        >
                            <div className="absolute -right-12 top-6 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white text-[10px] font-bold px-12 py-1 rotate-45 shadow-sm tracking-wider z-10">
                                ELITE
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-4 transition-transform group-hover:scale-110 relative z-0">
                                <Activity className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-bold text-lg mb-2 relative z-0">Mestre de Osciloscópio</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto relative z-0">Interpretação IA avançada de formas de onda e canais.</p>
                        </button>
                    </div>
                )}

                {!result && (activeType === "obd" || activeType === "osciloscopio") && (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 lg:p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col items-center text-center justify-center min-h-[300px] lg:min-h-[400px] border-dashed">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-2 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
                                <Camera className="h-10 w-10 text-blue-600 dark:text-blue-400 relative z-10" />
                            </div>

                            <CameraUpload onResult={handleResult} onProcessingStart={() => setIsAnalyzing(true)} onProcessingEnd={() => setIsAnalyzing(false)} type={activeType} contextVehicle={activeSessionVehicle} />
                        </div>
                    </div>
                )}

                {!result && activeType === "visual" && (
                    <div className="max-w-4xl mx-auto">
                        <VisualInspectionModule />
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

                    {isSaving && <div className="text-sm text-gray-500 flex items-center gap-2 px-1 mb-4"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> A guardar sessão db...</div>}

                    <DiagnosticTableView result={result} />
                    
                    {/* Conversational AI Chat Module */}
                    <DiagnosticChat diagnosticResult={result} />
                </div>
            )}

            {/* Multi-Photo Session View */}
            {activeSessionVehicle && !activeType && (
                <div className="space-y-12 animate-in fade-in max-w-4xl mx-auto">


                    {/* Render History from newest to oldest */}
                    {activeSessionRecords.length === 0 && !isAnalyzing && <p className="text-gray-500 text-center py-10">Inicie a análise utilizando o cartão acima.</p>}
                    
                    {/* Technical Disclaimer Banner - Persistent across results */}
                    {(activeSessionRecords.length > 0) && (
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
                         let parsedParams: any = { dtcs: [], parameters: [] };
                         try {
                              const raw = JSON.parse(record.parameters);
                              if (Array.isArray(raw)) {
                                  parsedParams.parameters = raw;
                              } else {
                                  parsedParams = raw;
                              }
                         } catch (e) {
                              console.error("Invalid JSON args in db");
                         }
                         
                         return (
                             <div key={record.id} className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800 first:border-0 first:pt-0">
                                 <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-1 mb-4">
                                     <Activity className="h-4 w-4" />
                                     Leitura gravada às {new Date(record.createdAt).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
                                 </div>
                                 <DiagnosticTableView result={{...parsedParams, vehicle: record.vehicle, diagnosis: record.diagnosis}} />
                             </div>
                         )
                    })}
                </div>
            )}



            </div>

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
