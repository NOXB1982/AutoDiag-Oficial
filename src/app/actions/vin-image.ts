"use server"

import { GoogleGenAI } from '@google/genai';

export async function extractVinFromImage(base64Image: string): Promise<{ success: boolean; vin?: string; error?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "A chave GEMINI_API_KEY não está configurada no ambiente." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        const base64Data = base64Image.split(',')[1];

        const prompt = `ANALISA ESTA IMAGEM E FOCO EXCLUSIVO EXTRAIR O NÚMERO DE CHASSI (VIN - VEHICLE IDENTIFICATION NUMBER).
É um código alfanumérico padrão de 17 caracteres. Ignora a sujidade ou brilho, usa o teu melhor raciocínio ótico para ler os dígitos gravados ou impressos.
Responde estritamente em JSON:
{
  "vin": "STRING_COM_17_CARACTERES_OU_NULL"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg'
                    }
                }
            ],
            config: {
                temperature: 0,
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return { success: false, error: "A IA não conseguiu analisar a imagem." };
        
        try {
            const cleanText = text.replace(/```json/i, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            if (parsed.vin && parsed.vin.length === 17) {
                return { success: true, vin: parsed.vin };
            } else {
                return { success: false, error: "VIN não legível ou com tamanho incorreto." };
            }
        } catch (e) {
            return { success: false, error: "Falha na estrutura de resposta da IA." };
        }

    } catch (error) {
        console.error("Erro na leitura de VIN por IA:", error);
        return { success: false, error: "Erro crítico ao processar fotografia do VIN." };
    }
}
