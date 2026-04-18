"use client"

import React, { useRef, useState } from "react"
import { Camera, Loader2, UploadCloud } from "lucide-react"
import { diagnoseImage } from "@/app/actions/diagnose"

export type DiagnosticResult = {
    vin?: string | null;
    vehicle: string;
    dtcs?: Array<{
        code: string;
        description: string;
        probableCauses?: string;
        symptoms?: string;
        howToTest?: string;
    }>;
    parameters: Array<{
        name: string;
        value: string;
        numericValue?: number | null;
        idealValue: string;
        numericIdealValue?: number | null;
        status: "ok" | "warning" | "error";
        explanation: {
            whatIsIt: string;
            meaning: string;
            highSymptom?: string;
            lowSymptom?: string;
            probableCause?: string;
            symptoms?: string;
            checkNext?: string;
        }
    }>;
    diagnosis: string;
    nextSteps?: string;
}

interface CameraUploadProps {
    onResult: (result: DiagnosticResult, base64Image?: string) => void;
    onProcessingStart?: () => void;
    onProcessingEnd?: () => void;
    type?: "obd" | "osciloscopio";
    contextVehicle?: string | null;
}

export function CameraUpload({ onResult, onProcessingStart, onProcessingEnd, type = "obd", contextVehicle = null }: CameraUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsProcessing(true)
        if (onProcessingStart) onProcessingStart()
        setError(null)

        try {
            const base64Image = await processImage(file)
            const result = await diagnoseImage(base64Image, type, contextVehicle)
            onResult(result, base64Image)
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro ao processar a imagem. Confirme a GEMINI_API_KEY no .env.local")
        } finally {
            setIsProcessing(false)
            if (onProcessingEnd) onProcessingEnd()
            if (fileInputRef.current) {
                fileInputRef.current.value = "" // reset input
            }
        }
    }

    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement("canvas")
                    // Resizing to max width for faster API upload
                    const MAX_WIDTH = 1200
                    const scale = Math.min(MAX_WIDTH / img.width, 1) // Only scale down

                    canvas.width = img.width * scale
                    canvas.height = img.height * scale

                    const ctx = canvas.getContext("2d")
                    if (!ctx) {
                        reject(new Error("Não foi possível processar a imagem no browser."))
                        return
                    }

                    // Aumentar contraste, brilho e remover cor ligeiramente para focar apenas nas matrizes dos pixels/texto
                    ctx.filter = "contrast(140%) brightness(105%) grayscale(30%)"

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                    // Comprimir para JPEG
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
                    resolve(dataUrl)
                }
                img.onerror = () => reject(new Error("Erro interno ao carregar a imagem selecionada."))
                img.src = event.target?.result as string
            }
            reader.onerror = () => reject(new Error("Erro a ler o ficheiro."))
            reader.readAsDataURL(file)
        })
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="flex flex-col items-center w-full">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <button
                onClick={triggerFileInput}
                disabled={isProcessing}
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group w-full sm:w-auto mt-4 ${type === 'osciloscopio' ? 'bg-purple-600 hover:bg-purple-500 focus-visible:outline-purple-600' : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600'}`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {type === 'osciloscopio' ? 'A processar onda... a analisar com IA...' : 'A processar reflexos... a analisar com IA...'}
                    </>
                ) : (
                    <>
                        <Camera className="h-5 w-5 transition-transform group-hover:scale-110" />
                        {type === 'osciloscopio' ? 'Tirar Foto à Onda (Osciloscópio)' : 'Tirar Foto ao Ecrã (OBD)'}
                    </>
                )}
            </button>
            <p className="mt-4 text-sm text-gray-500 text-center flex items-center gap-1 justify-center">
                <UploadCloud className="h-4 w-4" /> Também pode carregar captura da galeria.
            </p>

            {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm dark:bg-red-900/30 dark:text-red-400 max-w-md text-center border border-red-200 dark:border-red-800 break-words whitespace-pre-wrap">
                    {error}
                </div>
            )}
        </div>
    )
}
