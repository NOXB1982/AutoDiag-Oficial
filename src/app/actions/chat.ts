"use server"

import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
    role: 'user' | 'model' | 'ai';
    content: string;
}

export async function askDiagnosticQuestion(
    diagnosticContext: any,
    history: ChatMessage[],
    question: string
): Promise<{ success: boolean; answer?: string; error?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "A chave GEMINI_API_KEY não está configurada no ambiente." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        const systemPrompt = `És um Especialista Master em Diagnóstico Automóvel avançado.
Estás a ajudar um mecânico profissional a interpretar os resultados de um rastreio OBD/Live Data que já foi feito.

CONTEXTO DO VEÍCULO E DOS PARÂMETROS EXTRAÍDOS (Os dados em que te deves basear):
\`\`\`json
${JSON.stringify(diagnosticContext, null, 2)}
\`\`\`

REGRAS ESTritas:
1. Responde de forma direta, técnica e estruturada, focando-te puramente em soluções mecânicas/eletrónicas reais. 
2. Fala em Português de Portugal (PT-PT) coloquial mas extremamente profissional de oficina (Ex: injetores, coletor, massa de ar, FAP, cablagem, centralina).
3. Se a pergunta for fora da norma (ex: "quem és tu?"), responde que és o Assistente Técnico do AutoDiag AI desenhado para ajudar no diagnóstico deste carro.
4. Faz cruzamento de dados: Se a Massa de Ar estiver alta e o Trims de Injeção também, sugere X ou Y. Explica o PORQUÊ das tuas sugestões usando as anomalias ("errors" e "warnings") que tens no contexto JSON.
5. Se não souberes, indica testes físicos (ex: medir resistência no pino 2 da MAF) que o técnico pode realizar.
`;

        const formattedHistory = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Compreendido. Sou o Assistente Técnico AutoDiag AI. Inseri os dados dos parâmetros no meu contexto. Que dúvida técnica tem o mecânico sobre estes dados?" }] },
            ...history.map(msg => ({
                role: msg.role === 'ai' ? 'model' : msg.role,
                parts: [{ text: msg.content }]
            }))
        ];

        // The newest question
        formattedHistory.push({ role: 'user', parts: [{ text: question }] });

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: formattedHistory,
            config: {
                temperature: 0.4, // Slight variance for natural chat formatting
            }
        });

        const text = response.text;
        if (!text) {
            return { success: false, error: "A IA não devolveu resposta." };
        }

        return { success: true, answer: text };
    } catch (err: any) {
        console.error("Erro no Chat Gemini:", err);
        return { success: false, error: err.message || "Erro desconhecido de IA." };
    }
}
