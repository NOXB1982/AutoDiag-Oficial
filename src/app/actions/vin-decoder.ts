"use server"

import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

export async function lookupVinDb(vin: string) {
    if (!vin || vin.length !== 17) return null;
    try {
        const record = await prisma.vinCache.findUnique({ where: { vin } });
        return record;
    } catch (error) {
        console.error("Erro ao verificar VIN Cache DB:", error);
        return null;
    }
}

export async function saveVinDb(data: { vin: string, marca: string, modelo: string, ano: string, motor: string }) {
    if (!data.vin || data.vin.length !== 17) return null;
    try {
        const record = await prisma.vinCache.upsert({
            where: { vin: data.vin },
            update: {
                marca: data.marca,
                modelo: data.modelo,
                ano: data.ano,
                motor: data.motor
            },
            create: {
                vin: data.vin,
                marca: data.marca,
                modelo: data.modelo,
                ano: data.ano,
                motor: data.motor
            }
        });
        return record;
    } catch (error) {
        console.error("Erro ao guardar VIN Cache DB:", error);
        return null;
    }
}

export async function decodeVinAi(vin: string): Promise<{ marca?: string, modelo?: string, ano?: string, motor?: string } | null> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("A chave GEMINI_API_KEY não está configurada.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Analise o padrão estrutural e o identificador de fabricante mundial deste VIN: "${vin}".
Atenção Especial (Exemplo): Identifique que "SJN" sinaliza um Nissan UK e "F15" é o modelo Juke.
Identifique a Marca, o Modelo exato, o intervalo de Anos de fabrico provável e os Códigos de Motor (Engine Code) possíveis para este chassis.
Prioridade Máxima: Use bases de dados do mercado Europeu (Portugal/Reino Unido) para evitar confusões com modelos americanos.
Responda APENAS em formato JSON rígido. Deves ser o mais específico possível deduzindo o Código do Motor se identificares modelos únicos, sem enviar explicações de texto.

Formato exigido:
{
  "marca": "Ex: Nissan",
  "modelo": "Ex: Juke F15",
  "ano": "Ex: 2010-2019",
  "motor": "Ex: 1.5 dCi K9K"
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [prompt],
            config: { 
                temperature: 0.1, 
                responseMimeType: "application/json" 
            }
        });
        
        const text = response.text || "{}";
        const parsed = JSON.parse(text);
        return {
            marca: parsed.marca || "",
            modelo: parsed.modelo || "",
            ano: parsed.ano || "",
            motor: parsed.motor || ""
        };
    } catch(error) {
        console.error("AI VIN Decode falhou:", error);
        return null;
    }
}
