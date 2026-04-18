"use client"

import React, { useState, useRef } from "react"
import { analyzeSchematics, indexPdfPages, locateComponentCoordinates } from "@/app/actions/technical-doc"
import { FileSearch, UploadCloud, Loader2, Send, AlertTriangle, Camera, Search, XCircle } from "lucide-react"

export function TechnicalDocCard({ contextVehicle }: { contextVehicle?: string | null }) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileStr, setFileStr] = useState<string | null>(null)
    const [question, setQuestion] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [response, setResponse] = useState<{ analysis: string, pathTrace?: any[], sourcePage?: number, boundingBox?: [number, number, number, number] | null, croppedImage?: string } | null>(null)
    const [sourceImages, setSourceImages] = useState<Record<number, string>>({})
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [processingStatus, setProcessingStatus] = useState<string | null>(null)

    // PDF UI States
    const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([])
    const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0)
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
             setPdfThumbnails([])
             setActiveThumbnailIndex(0)
             setResponse(null)
             setError(null)
             
             if (file.type === "application/pdf") {
                 setIsGeneratingThumbnails(true)
                 const reader = new FileReader()
                 reader.onload = async (event) => {
                     const b64 = event.target?.result as string
                     setFileStr(b64)
                     try {
                         const pdfjsLib = await import('pdfjs-dist')
                         pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
                         const base64Data = b64.split(',')[1]
                         const binary = atob(base64Data)
                         const array = new Uint8Array(binary.length)
                         for(let i=0; i<binary.length; i++) array[i] = binary.charCodeAt(i)
                         
                         const loadingTask = pdfjsLib.getDocument({ data: array })
                         const pdf = await loadingTask.promise
                         const numPages = pdf.numPages
                         const limit = Math.min(numPages, 40) // ui limit
                         
                         const thumbs = []
                         for(let i=1; i<=limit; i++) {
                             const page = await pdf.getPage(i)
                             const viewport = page.getViewport({ scale: 0.8 })
                             const canvas = document.createElement("canvas")
                             const ctx = canvas.getContext("2d")
                             canvas.width = viewport.width; canvas.height = viewport.height;
                             if(ctx) { 
                                 await page.render({ canvasContext: ctx, viewport }).promise; 
                                 thumbs.push(canvas.toDataURL("image/jpeg", 0.6)) 
                             }
                         }
                         setPdfThumbnails(thumbs)
                     } catch(err) {
                         console.error(err)
                     } finally {
                         setIsGeneratingThumbnails(false)
                     }
                 }
                 reader.readAsDataURL(file)
             } else {
                 const base64 = await processFile(file)
                 setFileStr(base64)
                 setPdfThumbnails([base64])
             }
        } catch (e: any) {
             setError(e.message || "Erro interno ao processar o ficheiro local.")
        }
    }

    const processFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const isPDF = file.type === "application/pdf"
            const reader = new FileReader()

            if (isPDF) {
                reader.onload = (event) => resolve(event.target?.result as string)
                reader.onerror = () => reject(new Error("Erro ao ler o ficheiro PDF."))
                reader.readAsDataURL(file)
                return
            }

            reader.onload = (event) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement("canvas")
                    const MAX_WIDTH = 1200
                    const scale = Math.min(MAX_WIDTH / img.width, 1)

                    canvas.width = img.width * scale
                    canvas.height = img.height * scale

                    const ctx = canvas.getContext("2d")
                    if (!ctx) return reject(new Error("Erro de renderização."))
                    
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    resolve(canvas.toDataURL("image/jpeg", 0.75))
                }
                img.onerror = () => reject(new Error("Formato de imagem inválido."))
                img.src = event.target?.result as string
            }
            reader.onerror = () => reject(new Error("Erro ao ler ficheiro."))
            reader.readAsDataURL(file)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fileStr || !question.trim()) return

        setIsLoading(true)
        setError(null)
        setResponse(null)

        try {
            let answer: { data?: string | any, error?: string };

            if (fileStr.startsWith('data:application/pdf')) {
                // PDF MAP-REDUCE WORKFLOW (CLIENT-SIDE RENDER)
                setProcessingStatus("A carregar Motor P&R de PDF...")
                const pdfjsLib = await import('pdfjs-dist')
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
                
                const base64Data = fileStr.split(',')[1]
                const binary = atob(base64Data)
                const array = new Uint8Array(binary.length)
                for(let i=0; i<binary.length; i++) array[i] = binary.charCodeAt(i)
                
                const loadingTask = pdfjsLib.getDocument({ data: array })
                const pdf = await loadingTask.promise
                const numPages = pdf.numPages

                let pagesToRender = [1];
                if (numPages > 1) {
                    setProcessingStatus("A mapear índice de páginas...")
                    const lowResImages = []
                    for(let i=1; i<=numPages; i++) {
                        const page = await pdf.getPage(i)
                        const viewport = page.getViewport({ scale: 0.5 })
                        const canvas = document.createElement("canvas")
                        const ctx = canvas.getContext("2d")
                        canvas.width = viewport.width; canvas.height = viewport.height;
                        if(ctx) { await page.render({ canvasContext: ctx, viewport }).promise; lowResImages.push(canvas.toDataURL("image/jpeg", 0.6)) }
                    }

                    setProcessingStatus("A interpretar esquema estrutural...")
                    const targetPages = await indexPdfPages(lowResImages, question)
                    if (targetPages && targetPages.length > 0) pagesToRender = targetPages;
                }

                setProcessingStatus("A instanciar Bypass Vercel Edge. Vetores em encapsulamento Multiform...")
                const localSourceMap: Record<number, string> = {}
                
                // Generating thumbnails purely for UI visualization, 
                for(const pageNum of pagesToRender) {
                    if(pageNum < 1 || pageNum > numPages) continue;
                    const page = await pdf.getPage(pageNum)
                    const viewport = page.getViewport({ scale: 1.0 })
                    const canvas = document.createElement("canvas")
                    const ctx = canvas.getContext("2d")
                    canvas.width = viewport.width; canvas.height = viewport.height;
                    if(ctx) { 
                        await page.render({ canvasContext: ctx, viewport }).promise; 
                        localSourceMap[pageNum] = canvas.toDataURL("image/webp", 0.6);
                    }
                }
                setSourceImages(localSourceMap)

                setProcessingStatus("A Injetar PDF Vetorial Nativo (Raw Vector Data) no Cloud Run Engine...")
                const pdfBlobProxy = await fetch(fileStr).then(r => r.blob());
                const formData = new FormData();
                formData.append('document', pdfBlobProxy, 'technical_doc.pdf');
                formData.append('question', question);
                if (contextVehicle) formData.append('contextVehicle', contextVehicle);
                formData.append('sourcePagesMapping', pagesToRender.join(','));

                const extricationRes = await fetch('http://localhost:8080/api/v1/analyze', {
                    method: 'POST',
                    body: formData
                });

                if (!extricationRes.ok) {
                    const textErr = await extricationRes.text();
                    throw new Error(`Falha no Motor Cloud Run (HTTP ${extricationRes.status}): ${textErr}`);
                }

                answer = await extricationRes.json();
                
                if (answer && answer.data) {
                    if (typeof answer.data === 'object' && !Array.isArray(answer.data)) {
                        answer.data.sourcePage = pagesToRender[0];
                    }
                }

            } else {
                setSourceImages({ 1: fileStr })
                setProcessingStatus("A transcodificar imagem raster no Cloud Run...")
                
                const imgBlobProxy = await fetch(fileStr).then(r => r.blob());
                const formData = new FormData();
                formData.append('document', imgBlobProxy, 'technical_image.jpg');
                formData.append('question', question);
                if (contextVehicle) formData.append('contextVehicle', contextVehicle);

                const extricationRes = await fetch('http://localhost:8080/api/v1/analyze', {
                    method: 'POST',
                    body: formData
                });
                if (!extricationRes.ok) {
                    const textErr = await extricationRes.text();
                    throw new Error(`Falha no Motor Cloud Run (HTTP ${extricationRes.status}): ${textErr}`);
                }
                answer = await extricationRes.json();
            }

            if (answer && typeof answer === 'object' && answer.error) {
                setError(answer.error)
            } else if (answer && answer.data) {
                if (typeof answer.data === 'string') {
                    setResponse({ analysis: answer.data })
                } else {
                    const parsedData = answer.data as { analysis: string, pathTrace?: any[], sourcePage?: number, boundingBox?: [number, number, number, number] | null }
                    setResponse(parsedData)
                    if (parsedData.sourcePage && parsedData.sourcePage > 0) {
                        setActiveThumbnailIndex(parsedData.sourcePage - 1)
                    }
                }
            } else {
                setResponse({ analysis: "Erro desconhecido na resposta." })
            }
        } catch (err: any) {
            setError(err.message || "Erro de servidor.")
        } finally {
            setIsLoading(false)
            setProcessingStatus(null)
        }
    }

    return (
        <div className="border border-indigo-200 dark:border-indigo-900/40 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm flex flex-col items-center">
            <div className="flex items-center gap-3 mb-6 w-full border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <FileSearch className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Documentação Técnica IA</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Extração de pinagens, esquemas elétricos e mapas.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col gap-6">
                
                {/* Upload Area */}
                {!fileStr ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-indigo-200 dark:border-indigo-800/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
                    >
                        <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
                        <span className="font-semibold text-indigo-900 dark:text-indigo-300">Carregar Esquema Eletrico (PDF ou Imagem)</span>
                        <span className="text-xs text-gray-500 mt-1">Gere diagramas longos (ex: Manuais de 26+ Páginas)</span>
                    </div>
                ) : (
                    <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 group bg-gray-100 dark:bg-gray-900 shadow-inner min-h-[450px]">
                        {isGeneratingThumbnails ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-black/70 backdrop-blur-sm z-10 animate-in fade-in">
                                <Loader2 className="h-10 w-10 animate-spin mb-4 drop-shadow-sm" />
                                <span className="font-extrabold text-sm tracking-widest uppercase">A extrair páginas mecânicas...</span>
                            </div>
                        ) : pdfThumbnails.length > 0 ? (
                            <div className="flex flex-col w-full h-full">
                                {/* Main Image Preview */}
                                <div className="relative w-full bg-white dark:bg-gray-[950] flex items-center justify-center h-[450px]">
                                    <img 
                                        src={pdfThumbnails[activeThumbnailIndex]} 
                                        alt={`Página ${activeThumbnailIndex + 1}`} 
                                        className="max-w-full max-h-full object-contain p-2" 
                                    />
                                    
                                    {/* AI Processing Overlay */}
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-30 text-white animate-in fade-in">
                                            <div className="bg-indigo-600/20 p-4 rounded-full mb-4 ring-4 ring-indigo-500/30">
                                                <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
                                            </div>
                                            <span className="font-black text-xl text-center px-6 leading-tight mb-2">
                                                A digitalizar {pdfThumbnails.length} páginas<br/>para o cérebro da IA...
                                            </span>
                                            <span className="text-indigo-300 text-sm tracking-wide font-bold uppercase py-1 px-3 bg-indigo-900/50 rounded-full">{processingStatus || 'A investigar...'}</span>
                                        </div>
                                    )}

                                    {/* Change Document Button (Hover) */}
                                    {!isLoading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()} 
                                                className="bg-white text-indigo-900 px-5 py-3 rounded-xl text-sm font-black shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all outline-none"
                                            >
                                                TROCAR DOCUMENTO
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Thumbnails Carousel */}
                                {pdfThumbnails.length > 1 && (
                                    <div className="w-full bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 overflow-x-auto flex gap-3 snap-x scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-transparent">
                                        {pdfThumbnails.map((thumb, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setActiveThumbnailIndex(idx)}
                                                className={`relative shrink-0 w-[4.5rem] h-24 rounded-lg overflow-hidden border-2 transition-all snap-start ${activeThumbnailIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-500/50 shadow-lg scale-105 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-95'}`}
                                            >
                                                <img src={thumb} alt={`Página ${idx+1}`} className="w-full h-full object-cover bg-white" />
                                                <div className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-[10px] font-black ${activeThumbnailIndex === idx ? 'bg-indigo-600 text-white' : 'bg-black/60 text-white'}`}>
                                                    PÁG {idx + 1}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full min-h-[450px] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                <span className="text-gray-400 text-sm font-medium">Renderização de ficheiro nativo falhou.</span>
                            </div>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Question Input */}
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ex: Qual o fio de massa do imobilizador e onde liga?"
                        className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        required
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !fileStr || !question.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span className="hidden sm:inline">{isLoading ? (processingStatus || 'A processar...') : 'Analisar'}</span>
                    </button>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="mt-6 w-full max-w-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* AI Response Display */}
            {response && (
                <div className="mt-8 w-full max-w-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-6 shadow-sm animate-in slide-in-from-bottom-4">
                    
                    {/* Visual Proof Thumbnail Section */}
                    {response.sourcePage && sourceImages[response.sourcePage] && (
                        <div className="mb-8 w-full flex flex-col items-center border-b border-indigo-100 dark:border-indigo-800/30 pb-6">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 w-full mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Camera className="h-4 w-4" /> Prova Visual Autenticada (Página {response.sourcePage})
                            </h4>
                            <div 
                                className="relative w-full max-w-md rounded-xl overflow-hidden border-2 border-indigo-300 dark:border-indigo-700 cursor-zoom-in group shadow-md bg-white"
                                onClick={() => setIsZoomModalOpen(true)}
                            >
                                <img src={sourceImages[response.sourcePage]} className="w-full h-auto object-contain opacity-95 group-hover:opacity-100 transition-opacity" alt="Página de Referência" />
                                
                                {/* Bounding Box Highlight */}
                                {response.boundingBox && (
                                    <div 
                                        className="absolute border-2 border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10 transition-all duration-300"
                                        style={{
                                            top: `${response.boundingBox[0] / 10}%`,
                                            left: `${response.boundingBox[1] / 10}%`,
                                            height: `${(response.boundingBox[2] - response.boundingBox[0]) / 10}%`,
                                            width: `${(response.boundingBox[3] - response.boundingBox[1]) / 10}%`
                                        }}
                                    />
                                )}
                                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors pointer-events-none flex items-center justify-center">
                                    <div className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        <Search className="h-3 w-3" /> Clicar para Ampliar
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {response.croppedImage && (
                        <div className="mb-8 w-full flex flex-col items-center border-b border-indigo-100 dark:border-indigo-800/30 pb-6">
                            <h4 className="font-bold text-red-600 dark:text-red-400 w-full mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Search className="h-4 w-4" /> Recorte Contextual Isolado (Visão da IA)
                            </h4>
                            <p className="text-xs text-gray-500 mb-4 w-full text-left">
                                Apenas este fragmento microscópico foi analisado pela Inteligência Artificial para garantir Isolamento Absoluto do circuito alvo:
                            </p>
                            <div className="relative rounded-xl overflow-hidden border-2 border-red-400 dark:border-red-600 shadow-xl bg-white p-2 max-w-sm">
                                <img src={response.croppedImage} className="w-full h-auto object-contain" alt="Recorte Microscópico" />
                            </div>
                        </div>
                    )}

                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <FileSearch className="h-4 w-4" /> Resumo do Especialista
                    </h4>
                    
                    <div className="mb-4 w-full p-3 bg-gray-900 text-green-400 font-mono text-[10px] rounded-lg overflow-auto border border-gray-700">
                        <strong>RAW PAYLOAD DEBUG (Admin):</strong>
                        <pre>{JSON.stringify(response, null, 2)}</pre>
                    </div>

                    <div className="prose prose-indigo dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-medium">
                        {response.analysis && response.analysis.trim().length > 0 ? response.analysis : "[Aviso: O campo 'analysis' foi recebido completamente vazio pelo frontend]"}
                    </div>

                    {/* Path Tracing Nodes */}
                    {response.pathTrace && response.pathTrace.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-indigo-100 dark:border-indigo-800/30">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg> 
                                Tabela de Rastreio (Path Tracing)
                            </h4>
                            
                            <div className="space-y-4">
                                {response.pathTrace.map((node: any, idx: number) => (
                                    <div key={idx} className="relative flex items-start gap-4 p-4 bg-white dark:bg-gray-900 border border-indigo-50 dark:border-indigo-900/40 rounded-xl shadow-sm">
                                        
                                        {/* Timeline Line Connector */}
                                        {idx !== response.pathTrace!.length - 1 && (
                                            <div className="absolute top-12 left-[1.60rem] w-[2px] h-full bg-indigo-100 dark:bg-indigo-900/50 -z-10"></div>
                                        )}
                                        
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-4 ring-white dark:ring-gray-950 z-10">
                                            {node.step}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm truncate">{node.component}</h5>
                                                
                                                <div className="flex gap-2 shrink-0">
                                                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50">
                                                        Pino {node.pin}
                                                    </span>
                                                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                                                        Cor: {node.color}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                                {node.action}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-indigo-200/50 dark:border-indigo-800/30 text-[11px] text-indigo-700/80 dark:text-indigo-400 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {response.analysis?.includes("Confirme fisicamente as pinagens") 
                            ? "Informação formatada estruturalmente. Aja com responsabilidade e confirme dados via pin-out." 
                            : "Informação extraída por IA. Confirme sempre no veículo antes de intervir."}
                    </div>
                </div>
            )}
            
            {/* Click-to-Zoom Fullscreen Modal */}
            {isZoomModalOpen && response?.sourcePage && sourceImages[response.sourcePage] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 bg-black/95 backdrop-blur-md" onClick={() => setIsZoomModalOpen(false)}>
                    <div className="relative max-w-full max-h-full rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900" onClick={e => e.stopPropagation()}>
                        <button 
                            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black text-white p-2 rounded-full transition-colors backdrop-blur-md"
                            onClick={() => setIsZoomModalOpen(false)}
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                        
                        <div className="relative w-full h-[85vh] overflow-auto cursor-grab active:cursor-grabbing flex justify-center">
                            <div className="relative w-fit h-fit m-auto">
                                <img src={sourceImages[response.sourcePage]} className="max-w-none w-[auto] h-[150vh] object-contain" alt="Esquema Ampliado" />
                                
                                {response.boundingBox && (
                                    <div 
                                        className="absolute border-[6px] border-yellow-400 bg-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.8)] z-10 animate-pulse pointer-events-none"
                                        style={{
                                            top: `${response.boundingBox[0] / 10}%`,
                                            left: `${response.boundingBox[1] / 10}%`,
                                            height: `${(response.boundingBox[2] - response.boundingBox[0]) / 10}%`,
                                            width: `${(response.boundingBox[3] - response.boundingBox[1]) / 10}%`
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
