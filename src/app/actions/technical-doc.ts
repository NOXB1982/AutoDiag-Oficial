"use server"

import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function indexPdfPages(thumbnailsBase64: string[], question: string): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key em falta.");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const inlineParts = thumbnailsBase64.map(b64 => ({
        inlineData: { data: b64.includes(',') ? b64.split(',')[1] : b64, mimeType: 'image/jpeg' }
    }));
    
    const prompt = `Analisa estas ${thumbnailsBase64.length} miniaturas de páginas de um manual auto. A Página 1 corresponde à primeira miniatura submetida e assim sucessivamente.
Objetivo da Localização Física: Procurar pela etiqueta literal "${question}" (ex: Y3, Injetores).
Quais destas páginas têm maior probabilidade de conter o diagrama com esse componente EXATO impresso?
Responde APENAS com um array JSON de inteiros (1-indexed) contendo até às 4 páginas mais prováveis, ORDENADAS da mais provável para a menos provável (Ex: [2, 3, 1, 4]). Se não conseguires ver bem, devolve o array com todas as páginas disponíveis para garantir que a pesquisa o encontra.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [prompt, ...inlineParts],
            config: { temperature: 0, responseMimeType: "application/json" }
        });
        const arr = JSON.parse(response.text || "[]");
        return Array.isArray(arr) ? arr : [];
    } catch(e) {
         console.error("Index Error:", e);
         // Fallback to first 3 pages if it fails
         return thumbnailsBase64.map((_, i) => i + 1).slice(0, 3);
    }
}

export async function analyzeSchematics(highResImagesBase64: string[], question: string, contextVehicle?: string, sourcePagesMapping?: number[]): Promise<{ data?: string, error?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { error: "A chave GEMINI_API_KEY não está configurada no ambiente." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        // Rate Limiting Check
        const headerStore = await headers();
        const ip = headerStore.get('x-forwarded-for') || "127.0.0.1";
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const requestCount = await prisma.rateLimit.count({
            where: { ip, endpoint: "technical-doc", createdAt: { gte: oneHourAgo } }
        });
        
        if (requestCount >= 9999) {
            return { error: "Atingiste o limite de diagnósticos por hora. Espera um pouco ou faz upgrade para o plano Pro." };
        }
        
        await prisma.rateLimit.create({ data: { ip, endpoint: "technical-doc" } });

        const inlineParts = highResImagesBase64.map(b64 => {
            let mimeType = 'image/jpeg';
            if (b64.startsWith('data:image/png')) mimeType = 'image/png';
            if (b64.startsWith('data:image/webp')) mimeType = 'image/webp';
            return {
                inlineData: { data: b64.includes(',') ? b64.split(',')[1] : b64, mimeType }
            };
        });
        
        let prompt = `Aja como um Técnico Mecânico de Alta Refrigeração e Especialista Máximo em Esquemas Elétricos Automóveis.
A imagem em anexo é um esquema elétrico ou fluxograma de serviço.  
O teu objetivo é analisar detalhadamente a imagem e mapear o componente: "${question}"

${contextVehicle ? `Veículo de Contexto: ${contextVehicle}` : ''}

${sourcePagesMapping ? `MAPA DE PÁGINAS FORNECIDO:
As imagens em anexo correspondem às seguintes páginas originais: [${sourcePagesMapping.join(', ')}]. A primeira imagem é a página ${sourcePagesMapping[0]}, etc.` : ''}

INSTRUÇÕES DO PENSAMENTO VISUAL DE ALTA PRECISÃO:
1. PESQUISA ALVO: Recebeste a(s) página(s) completa(s) do esquema (em Alta Resolução). O primeiro passo é varreres a imagem e localizares a palavra/etiqueta exata do teu alvo (ex: "${question}"). 
2. A TUA AMNÉSIA MECÂNICA (VITAL!): O teu treino maciço em engenharia automóvel e normas DIN 72551 (onde massa/ground é sempre castanho 'br') está a envenenar a tua visão. É ESTRITAMENTE PROIBIDO assumires que um fio de pulso de massa da ECU tem a cor 'br' só porque a lógica alemã o exige. 
3. CONFIANÇA CEGA NO OCR: Os construtores violam a norma frequentemente. Se no papel estiver escrtio nitidamente o código 'rt' (vermelho), tu TENS de escrever 'rt', mesmo que o teu instinto mecânico grite que isso devia ser alimentação e não pulso! Não deduzas, apenas TRANSCREVE de forma pura os píxeis impressos no esquema sobrepondo as linhas, mesmo que sejam 'rt sw', 'rt gn', 'rt gr'.
4. ISOLAMENTO ABSOLUTO: Assim que encontrares o bloco exato com a etiqueta "${question}", foca-te ÚNICA e EXCLUSIVAMENTE nas linhas que entram/saem fisicamente do seu limite de desenho. Não as vistas e anota os Pinos de destino (ex: ECU) e a Cor EXATA transcrita.
5. TRADUÇÃO ISO: [rt=Vermelho | bl=Azul | sw=Preto | gn=Verde | gr=Cinzento | ws=Branco | br=Castanho | vi=Roxo | ge=Amarelo | li=Lilás | rs=Rosa | nf=Incolor].

DIRETRIZES DE SAÍDA OBRIGATÓRIAS (APENAS JSON VÁLIDO):
Devolve o teu raciocínio livre incapsulado exatamente nesta estrutura JSON compatível com a nossa UI, para podermos desenhar gráficos bonitos:
{
  "sourcePage": 1, // Página on se encontra a peça
  "boundingBox": [ymin, xmin, ymax, xmax], // Cordenadas [0-1000] da zona focada
  "analysis": "A tua resposta em Markdown onde tu explicas livremente como a peça está montada, que fios identificaste, onde achas que vai dar a alimentação e qual é o sinal, etc. Não tenhas limites verbais aqui, pensa em voz alta como um eletricista!",
  "pathTrace": [
    // Preenche um objeto para cada fio de ligação principal fidedigno da peça solicitada
    {
      "step": 1,
      "component": "Nome Técnico Exato que leste",
      "pin": "O pino da peça (Ex: 1, 2, 3)",
      "color": "A Cor Extensa (ex: Vermelho - rt)",
      "action": "Qual é a via ou destino (ex: Alimentação ECU pino 42)"
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [prompt, ...inlineParts],
            config: {
                temperature: 0.0,
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) return { error: "A IA não devolveu resposta." };

        let payload;
        try {
            payload = JSON.parse(text);
            
            // UNWRAP ARRAY ENVELOPE (Gemini hallucination fix)
            if (Array.isArray(payload) && payload.length > 0) {
                payload = payload[0];
            }
            
            // STRICT TYPE COERCION AND SCHEMATIC FALLBACK (Anti-React-Crash)
            if (payload && !payload.analysis) {
                // Se a IA gerou chaves com nomes diferentes (ex: "analise", "resumo")
                const possibleKeys = ["Análise", "analise", "resultado", "texto", "resumo", "answer", "diagnostico"];
                for (const k of possibleKeys) {
                    if (payload[k] && typeof payload[k] === 'string') {
                        payload.analysis = payload[k];
                        break;
                    }
                }
                
                // Se continuar vazio e houver chaves não mapeadas, faz dump do JSON inteiro
                if (!payload.analysis) {
                    const keys = Object.keys(payload);
                    if (keys.length > 0 && (keys.length > 1 || keys[0] !== 'pathTrace')) {
                        payload.analysis = JSON.stringify(payload, null, 2);
                    } else {
                        // Caso a IA não coloque ABSOLUTAMENTE NADA de útil:
                        payload.analysis = "Nenhum texto descritivo gerado pela IA. Por favor, seja mais específico na pergunta ou os componentes não foram localizados.";
                    }
                }
            }

            if (payload && typeof payload.analysis !== 'string') {
                payload.analysis = typeof payload.analysis === 'object' 
                    ? JSON.stringify(payload.analysis, null, 2) 
                    : String(payload.analysis);
            }

            if (payload && payload.pathTrace && !Array.isArray(payload.pathTrace)) {
                payload.pathTrace = [];
            }
        } catch (e) {
            console.error("Erro JSON parse no Technical Doc:", e, text);
            return { error: "Ocorreu um erro ao formatar os dados de rastreio (Parse Error)." };
        }

        return { data: payload };
    } catch (error: any) {
        console.error("Erro no módulo documental Gemini:", error.message || error);
        return { error: "Falha ao analisar o documento técnico. Confirme a chave GEMINI_API_KEY ou tente uma foto menor." };
    }
}

export async function locateComponentCoordinates(
    highResImagesBase64: string[],
    question: string,
    contextVehicle?: string,
    sourcePagesMapping?: number[]
) {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("API Key em falta.");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const headerStore = await headers();
        const ip = headerStore.get('x-forwarded-for') || "127.0.0.1";
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const requestCount = await prisma.rateLimit.count({
            where: { ip, endpoint: "locator", createdAt: { gte: oneHourAgo } }
        });
        
        if (requestCount >= 9999) return { error: "Limite atingido." };
        await prisma.rateLimit.create({ data: { ip, endpoint: "locator" } });

        const inlineParts = highResImagesBase64.map(b64 => {
            let mimeType = 'image/jpeg';
            if (b64.startsWith('data:image/png')) mimeType = 'image/png';
            if (b64.startsWith('data:image/webp')) mimeType = 'image/webp';
            return { inlineData: { data: b64.includes(',') ? b64.split(',')[1] : b64, mimeType } };
        });
        
        const prompt = `Aja como um Sistema de Rastreio Espacial Automático. O teu objetivo ÚNICO é localizar as coordenadas da caixa delimitadora "boundingBox" da peça "${question}" na imagem fornecida.
        
        ${contextVehicle ? `Veículo de Contexto: ${contextVehicle}` : ''}
        ${sourcePagesMapping ? `A imagem corresponde à página original: [${sourcePagesMapping[0]}]` : ''}
        
        INSTRUÇÕES VISUAIS OBRIGATÓRIAS E TÁTICA OCR EXTREMA:
        1. RASTREIO DE SOBREPOSIÇÃO: Em esquemas automóveis complexos, o texto das etiquetas (ex: "${question}") está frequentemente impresso DIRETAMENTE SOBREPOSTO ou ENCOSTADO às linhas pretas dos fios. O texto "corta" o desenho. Se fizeres scan apenas à "Vizinhança Branca Limpa", vais ficar cego ao alvo. Faz zoom às zonas mais densas (ex: acima da ECU) e lê o texto misturado com as linhas!
        2. EXCLUSIVIDADE DO ALVO: É crucial não confundires o teu alvo com componentes desenhados no espaço imediatamente ao lado só porque saltam mais à vista ou têm o mesmo número de fios (ex: se pedirem Y3 Injetores, NUNCA apontes para a T1 Bobina).
        3. Cria uma Bounding Box (ymin, xmin, ymax, xmax) rigorosamente justa à caixa demarcadora do alvo visualizado.
        4. ESCAPE HATCH (MUITO IMPORTANTE): Se, após varrer intensamente as linhas pretas, a peça NÃO ESTIVER VISÍVEL E CLARA nesta folha, é PROIBIDO atirar coordenadas de vizinhos. Deves OBRIGATORIAMENTE devolver "boundingBox": null.
        5. As coordenadas numéricas vão de 0 a 1000.
        
        DEVOLVE ESTRITAMENTE O SEGUINTE JSON:
        {
          "reasoning": "Breve justificação de um parágrafo sobre onde encontraste a peça ou porque achas que é a peça certa.",
          "literalTextFound": "Escreve exatamente as letras/números da etiqueta que encontraste colada à peça (ex: Y3, T1). Se não encontraste a etiqueta certa, deixa vazio.",
          "componentFoundOnThisPage": true, // false se a etiqueta não for a solicitada
          "sourcePage": ${sourcePagesMapping ? sourcePagesMapping[0] : 1},
          "boundingBox": [ymin, xmin, ymax, xmax] // ou [] se componentFoundOnThisPage for false
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [prompt, ...inlineParts],
            config: { temperature: 0, responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) return { error: "A IA não conseguiu rastrear as coordenadas." };

        let payload;
        try {
            payload = JSON.parse(text);
            if (Array.isArray(payload)) payload = payload[0];
            
            // Cognitive Checkpoint Escapes
            if (payload.componentFoundOnThisPage === false) {
                 return { error: "⚠️ COMPONENTE AUSENTE NESTA PÁGINA: O nosso scanner de alta-precisão analisou o PDF e não encontrou a etiqueta literal. A IA Recusou-se a alucinar um componente vizinho." };
            }
            if (payload.boundingBox === null || payload.boundingBox === "null" || payload.boundingBox?.length === 0) {
                return { error: "⚠️ COMPONENTE AUSENTE NESTA PÁGINA: O nosso scanner de alta-precisão analisou o PDF e confirma que a peça solicitada não se encontra fisicamente impressa nesta folha." };
            }
            if (!payload.boundingBox || payload.boundingBox.length !== 4) return { error: "Coordenadas inválidas geradas pela IA. Tente novamente." };
        } catch (e) {
            return { error: "Falha de processamento espacial (Parse Error JSON)." };
        }

        return { data: payload };
    } catch (error: any) {
        return { error: "Erro crítico no scanner espacial." };
    }
}
