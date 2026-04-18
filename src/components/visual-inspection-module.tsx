"use client"

import React, { useRef, useState, useMemo } from "react"
import { Camera, Loader2, UploadCloud, CheckCircle2, AlertTriangle, Activity, X } from "lucide-react"
import { identifyPart, analyzePinout } from "@/app/actions/visual-inspection"

export type PinData = {
    id: string;
    description: string;
    box: [number, number, number, number]; // ymin, xmin, ymax, xmax (0-1000)
}

export type InspectionResult = {
    oscilloscope: { voltage: string; time: string } | null;
    multimeter: { mode: string; expectedValue: string } | null;
    signalType: string;
    connectionSetup?: { 
        channelA: string, ground: string,
        multimeterRed?: string, multimeterBlack?: string
    };
    componentCondition?: string;
    pins: PinData[];
}

export function VisualInspectionModule() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // Core states
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0)
    const [imageStr, setImageStr] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    // Identification results
    const [componentName, setComponentName] = useState<string | null>(null)
    const [componentRef, setComponentRef] = useState<string | null>(null)
    
    // Pinout & Data results
    const [inspectionData, setInspectionData] = useState<InspectionResult | null>(null)
    const [measuringMode, setMeasuringMode] = useState<"oscilloscope" | "multimeter">("oscilloscope")

    // Image Transcoder
    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement("canvas")
                    const MAX_WIDTH = 1200
                    const scale = Math.min(MAX_WIDTH / img.width, 1)

                    canvas.width = img.width * scale
                    canvas.height = img.height * scale

                    const ctx = canvas.getContext("2d")
                    if (!ctx) return reject(new Error("Erro de renderização gráfica."))
                    
                    // Ligeiro aumento visual de contraste para a IA ver melhor os pinos
                    ctx.filter = "contrast(120%) brightness(110%)"
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    resolve(canvas.toDataURL("image/jpeg", 0.8))
                }
                img.onerror = () => reject(new Error("Formato inválido de imagem."))
                img.src = event.target?.result as string
            }
            reader.onerror = () => reject(new Error("Não foi possível ler o ficheiro."))
            reader.readAsDataURL(file)
        })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError(null)
        setStep(1) // Em processamento inicial (identificar a peça)

        try {
            const base64 = await processImage(file)
            setImageStr(base64)
            
            const result = await identifyPart(base64)
            if (result.error || !result.data) {
                setError(result.error || "A IA não conseguiu identificar a peça.")
                setStep(0)
                return
            }

            setComponentName(result.data.component || "Componente Desconhecido")
            setComponentRef(result.data.reference || null)
            setStep(2) // Confirmation step

        } catch (err: any) {
            setError(err.message || "Erro durante o upload e análise inicial.")
            setStep(0)
        }
    }

    const handleConfirm = async () => {
        if (!imageStr || !componentName) return

        setError(null)
        setStep(3) // Analyzing pinout and data

        try {
            const result = await analyzePinout(imageStr, componentName)
            
            if (result.error || !result.data) {
                setError(result.error || "Não foi possível extrair a pinagem da fotografia.")
                setStep(2) // fallback back to confirm
                return
            }

            setInspectionData(result.data)
            setStep(4) // Final Results View

        } catch (err: any) {
             setError(err.message || "A Vercel cortou a ligação ou ocorreu um erro de extração.")
             setStep(2)
        }
    }

    const handleCancel = () => {
        setImageStr(null)
        setComponentName(null)
        setComponentRef(null)
        setInspectionData(null)
        setError(null)
        setStep(0)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    // Coordinates mapper to percentages with Collision Repulsion
    const pinStyles = useMemo(() => {
        if (!inspectionData?.pins) return [];
        
        let centers = inspectionData.pins.map(p => {
            const [ymin, xmin, ymax, xmax] = p.box;
            return {
                top: ((ymin + ymax) / 2) / 10,
                left: ((xmin + xmax) / 2) / 10
            };
        });

        // Repel coordinates that are too close (overlapping AI bounding boxes)
        const MIN_DIST = 15; // 15% distance separation max spread
        for (let iter = 0; iter < 8; iter++) { // multi-pass relaxation
            for (let i = 0; i < centers.length; i++) {
                for (let j = i + 1; j < centers.length; j++) {
                    const dy = centers[i].top - centers[j].top;
                    const dx = centers[i].left - centers[j].left;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < MIN_DIST) {
                        // Se estiverem literalmente no mesmo pixel (falha crassa da IA), adicionar ruído
                        const safeDx = dist === 0 ? (Math.random() - 0.5) : dx;
                        const safeDy = dist === 0 ? (Math.random() - 0.5) : dy;
                        const safeDist = dist === 0 ? 0.1 : dist;

                        const pushFactor = (MIN_DIST - safeDist) / 2.5;
                        const ang = Math.atan2(safeDy, safeDx);
                        
                        centers[i].left += Math.cos(ang) * pushFactor;
                        centers[i].top += Math.sin(ang) * pushFactor;
                        centers[j].left -= Math.cos(ang) * pushFactor;
                        centers[j].top -= Math.sin(ang) * pushFactor;
                    }
                }
            }
        }

        return centers.map(c => ({
            top: `${Math.max(5, Math.min(95, c.top))}%`,
            left: `${Math.max(5, Math.min(95, c.left))}%`,
            transform: "translate(-50%, -50%)"
        }));
    }, [inspectionData]);

    return (
        <div className="w-full flex justify-center pb-8 border border-blue-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm flex-col items-center">
            
            <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
            />

            {/* ERROR DISPLAY */}
            {error && (
                <div className="w-full mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-center text-sm font-medium border border-red-200">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-red-500" />
                    {error}
                </div>
            )}

            {/* STEP 0: Upload Form */}
            {step === 0 && (
                <div className="flex flex-col items-center justify-center p-8 w-full">
                     <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                        <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                     </div>
                     <h3 className="font-bold text-xl text-gray-900 dark:text-white text-center mb-2">Fotografar Componente</h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm mb-8">
                         Ex: Tire uma foto nítida e direta a uma Eletroválvula ou Sensor para iniciar a Análise IA e ver a pinagem.
                     </p>
                     
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-colors w-full sm:w-auto text-lg justify-center"
                     >
                        <Camera className="h-6 w-6" /> Abrir Câmara Traseira
                     </button>
                </div>
            )}

            {/* STEP 1 & 3: Global Loaders */}
            {(step === 1 || step === 3) && (
                <div className="flex flex-col items-center justify-center p-12 py-16 text-center">
                     <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                     <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                         {step === 1 ? 'A identificar arquitetura da Peça...' : 'A projetar geometria de pinos e sinais...'}
                     </h3>
                     <p className="text-sm text-gray-500 mt-2 max-w-xs">
                         O Gemini 3.1 Pro está a processar fotogrametria matricial. Demora cerca de 4 segundos.
                     </p>
                     {imageStr && step === 3 && (
                         <img src={imageStr} className="mt-6 w-32 h-32 object-cover rounded-xl border-4 border-gray-100 opacity-60 grayscale" alt="Ghosted parsing layer" />
                     )}
                </div>
            )}

            {/* STEP 2: Pre-Confirmation Check */}
            {step === 2 && imageStr && (
                 <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
                      <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
                           <img src={imageStr} alt="Uploaded Capture" className="w-full h-auto aspect-[4/3] object-cover" />
                      </div>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-6 text-center w-full max-w-sm shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
                           <h4 className="text-sm uppercase tracking-wider font-bold text-yellow-800 dark:text-yellow-500 mb-1">
                               Deteção Automática
                           </h4>
                           <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                               {componentName}
                           </h3>
                           {componentRef && (
                               <div className="text-sm font-semibold bg-white/60 dark:bg-black/40 px-3 py-1 inline-block rounded-md text-gray-700 dark:text-gray-300 mb-4 border border-yellow-200/50">
                                   Ref (ou aproximada): {componentRef}
                               </div>
                           )}
                           <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">Correto? Se sim, a IA irá gerar o mapa de pinos imediatamente.</p>
                           
                           <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirm}
                                    className="bg-green-600 hover:bg-green-500 text-white rounded-lg py-3 px-4 font-bold flex justify-center items-center gap-2 shadow-sm"
                                >
                                    <CheckCircle2 className="h-5 w-5" /> Sim, é isso mesmo. Avançar!
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg py-3 px-4 font-bold flex justify-center items-center gap-2"
                                >
                                    <X className="h-5 w-5 text-gray-500" /> Falhou. Tentar Nova Imagem
                                </button>
                           </div>
                      </div>
                 </div>
            )}

            {/* STEP 4: Final Pinout Results */}
            {step === 4 && inspectionData && imageStr && (
                 <div className="w-full animate-in slide-in-from-bottom-8 duration-500">
                      <div className="flex justify-between items-center mb-6">
                           <h2 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                               <CheckCircle2 className="h-6 w-6 text-green-500" />
                               {componentName}
                           </h2>
                           <button 
                               onClick={handleCancel}
                               className="text-sm font-bold bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                           >
                               Nova Peça
                           </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
                           {/* Left Side: Photo with Absolute Overlays */}
                           <div className="w-full relative rounded-2xl border-4 border-gray-100 dark:border-gray-900 shadow-md bg-black overflow-hidden object-contain flex justify-center">
                                <img src={imageStr} alt="Componente Analisado" className="w-full h-auto max-h-[600px] object-contain block opacity-95" />
                                
                                {/* Overlay Plotter with Collision Physics */}
                                {inspectionData.pins.map((pin, i) => (
                                    <div 
                                        key={i} 
                                        className="absolute flex flex-col items-center transition-all duration-700 ease-out z-20 hover:z-30 hover:scale-110 cursor-pointer" 
                                        style={pinStyles[i]}
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[3px] border-white bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        </div>
                                        <div className="mt-1 bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap shadow-lg">
                                            {pin.id}
                                        </div>
                                    </div>
                                ))}
                           </div>

                           {/* Right Side: Oscilloscope & Reference Tables */}
                           <div className="space-y-6">
                                
                                {/* Visão Pro Alert */}
                                {inspectionData.componentCondition && (
                                    <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm transition-colors ${inspectionData.componentCondition.toLowerCase().includes('bom') || inspectionData.componentCondition.toLowerCase().includes('ok') ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                                        <div className={`p-2 rounded-xl shrink-0 ${inspectionData.componentCondition.toLowerCase().includes('bom') || inspectionData.componentCondition.toLowerCase().includes('ok') ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                                            <Camera className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className={`font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5 ${inspectionData.componentCondition.toLowerCase().includes('bom') || inspectionData.componentCondition.toLowerCase().includes('ok') ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>
                                                <Activity className="h-3.5 w-3.5" /> Visão Pro: Cablagem
                                            </h3>
                                            <p className={`text-sm font-semibold leading-relaxed ${inspectionData.componentCondition.toLowerCase().includes('bom') || inspectionData.componentCondition.toLowerCase().includes('ok') ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'}`}>
                                                {inspectionData.componentCondition}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Toggle Mode Switch */}
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl mb-2">
                                    <button 
                                        onClick={() => setMeasuringMode("oscilloscope")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${measuringMode === "oscilloscope" ? "bg-white dark:bg-gray-950 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        <Activity className="h-4 w-4" /> Osciloscópio
                                    </button>
                                    <button 
                                        onClick={() => setMeasuringMode("multimeter")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${measuringMode === "multimeter" ? "bg-white dark:bg-gray-950 shadow-sm text-green-600 dark:text-green-400" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        <Activity className="h-4 w-4" /> Multímetro
                                    </button>
                                </div>

                                {/* Reading Box */}
                                <div className={`bg-gradient-to-br ${measuringMode === 'oscilloscope' ? 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border-indigo-100 dark:border-indigo-900/30' : 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-900/10 border-green-100 dark:border-green-900/30'} border p-6 rounded-2xl shadow-sm transition-colors duration-300`}>
                                    <h3 className={`font-bold ${measuringMode === 'oscilloscope' ? 'text-indigo-900 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50' : 'text-green-900 dark:text-green-400 border-green-200/50 dark:border-green-800/50'} mb-5 flex items-center gap-2 border-b pb-3`}>
                                        <Activity className="h-5 w-5" />
                                        Guia de Medição Rápida
                                    </h3>
                                    
                                    {measuringMode === "oscilloscope" ? (
                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            <div className="bg-white dark:bg-black/20 rounded-xl p-4 border border-indigo-50 dark:border-indigo-900/20">
                                                <p className="uppercase text-[10px] text-gray-500 font-bold tracking-widest mb-1">Voltagem / Div</p>
                                                <p className="text-xl font-black text-gray-900 dark:text-white">
                                                    {inspectionData.oscilloscope?.voltage || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-white dark:bg-black/20 rounded-xl p-4 border border-indigo-50 dark:border-indigo-900/20">
                                                <p className="uppercase text-[10px] text-gray-500 font-bold tracking-widest mb-1">Tempo / Div</p>
                                                <p className="text-xl font-black text-gray-900 dark:text-white">
                                                    {inspectionData.oscilloscope?.time || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            <div className="bg-white dark:bg-black/20 rounded-xl p-4 border border-green-50 dark:border-green-900/20">
                                                <p className="uppercase text-[10px] text-gray-500 font-bold tracking-widest mb-1">Modo / Roda</p>
                                                <p className="text-xl font-black text-gray-900 dark:text-white">
                                                    {inspectionData.multimeter?.mode || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-white dark:bg-black/20 rounded-xl p-4 border border-green-50 dark:border-green-900/20">
                                                <p className="uppercase text-[10px] text-gray-500 font-bold tracking-widest mb-1">Valor Referência</p>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">
                                                    {inspectionData.multimeter?.expectedValue || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`${measuringMode === 'oscilloscope' ? 'bg-indigo-600 text-indigo-200' : 'bg-green-600 text-green-200'} text-white rounded-xl p-4 shadow-inner flex flex-col justify-center items-center text-center transition-colors duration-300`}>
                                        <p className="text-xs uppercase tracking-widest font-semibold mb-1">TIPO DE SINAL</p>
                                        <p className="text-lg font-bold leading-tight text-white">{inspectionData.signalType}</p>
                                    </div>
                                </div>

                                {/* Dynamic Connection Web */}
                                {inspectionData.connectionSetup && (
                                    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-6 rounded-2xl shadow-xl overflow-hidden relative border border-indigo-500/30">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Activity className="w-32 h-32 text-indigo-400" />
                                        </div>
                                        <h3 className="font-black text-indigo-300 mb-6 flex items-center gap-2 relative z-10 text-sm tracking-widest uppercase">
                                            Esquema de Ligação Analógico
                                        </h3>
                                        
                                        <div className="flex flex-col gap-6 relative z-10">
                                            {/* Red Probe Node */}
                                            <div className="flex items-center gap-4">
                                                <div className="bg-red-500/20 border-2 border-red-500 text-red-100 rounded-lg px-3 py-2 text-xs font-black shadow-[0_0_15px_rgba(239,68,68,0.2)] shrink-0 w-20 text-center">
                                                    {measuringMode === 'oscilloscope' ? 'CH A' : 'VΩmA'}
                                                </div>
                                                <div className="h-0.5 bg-gradient-to-r from-red-500 to-red-500/10 flex-1 relative flex items-center justify-center">
                                                    <div className="absolute right-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                </div>
                                                <div className="bg-white/10 text-white rounded-lg px-4 py-2 text-sm font-medium border border-white/20 w-48 shrink-0 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    {measuringMode === 'oscilloscope' ? inspectionData.connectionSetup.channelA : (inspectionData.connectionSetup.multimeterRed || "N/A")}
                                                </div>
                                            </div>

                                            {/* Black Probe Node */}
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-800 border-2 border-gray-600 text-gray-300 rounded-lg px-3 py-2 text-xs font-black shadow-inner shrink-0 w-20 text-center">
                                                    {measuringMode === 'oscilloscope' ? 'GND' : 'COM'}
                                                </div>
                                                <div className="h-0.5 bg-gradient-to-r from-gray-500 to-gray-500/10 flex-1 relative flex items-center justify-center">
                                                    <div className="absolute right-0 w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                                                </div>
                                                <div className="bg-white/10 text-white rounded-lg px-4 py-2 text-sm font-medium border border-white/20 w-48 shrink-0 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                    {measuringMode === 'oscilloscope' ? inspectionData.connectionSetup.ground : (inspectionData.connectionSetup.multimeterBlack || "N/A")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pinout Table */}
                                <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                                            Legenda de Pinos Analisada
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {inspectionData.pins.map((pin, index) => (
                                            <div key={index} className="flex px-4 py-3 bg-white dark:bg-gray-950 items-center justify-between">
                                                <span className="font-bold text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-center min-w-[60px]">{pin.id}</span>
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 text-right">{pin.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Safety Banner Constraint */}
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-4 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-yellow-800 dark:text-yellow-400 font-semibold leading-relaxed">
                                        <span className="uppercase text-yellow-900 dark:text-yellow-300 font-bold">AVISO DE RESPONSABILIDADE: </span>
                                        A IA identifica padrões geográficos prováveis. Confirme a polaridade com a documentação ou multímetro. A medição final e a integridade da cablagem são da responsabilidade exclusiva do técnico no local.
                                    </p>
                                </div>
                           </div>
                      </div>
                 </div>
            )}
        </div>
    )
}
