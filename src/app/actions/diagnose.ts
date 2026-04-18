"use server"

import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function diagnoseImage(
    base64Image: string, 
    type: "obd" | "osciloscopio" = "obd",
    contextVehicle: string | null = null
) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("A chave GEMINI_API_KEY não está configurada no ambiente.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        // base64Image comes as "data:image/jpeg;base64,...", need to strip the prefix
        const base64Data = base64Image.split(',')[1];

        // Memória Hashing: Verificar se esta foto já foi analisada
        const hashStr = crypto.createHash('sha256').update(base64Data).digest('hex');
        const cacheKey = `${type}_${hashStr}`;
        try {
            const cached = await prisma.diagnosticCache.findUnique({ where: { hash: cacheKey } });
            if (cached) {
                console.log("Memory Hit: Devolução imediata via Hash.");
                return JSON.parse(cached.response);
            }
        } catch (e) {
            console.error(e);
        }

        let prompt = ``;
        if (type === "osciloscopio") {
            prompt = `ANALISA ESTA IMAGEM DE UM ECRÃ DE OSCILOSCÓPIO.
FOCO EXCLUSIVO EM DADOS TÉCNICOS. NÃO DÊS DICAS DE MEDIÇÃO, SOLUÇÕES DE TESTE OU REPARAÇÃO. Esta é uma ferramenta passiva de consulta.

PRIORIDADE MÁXIMA:
1. CURSO DO VIN: Tenta identificar o Número de Identificação do Veículo (VIN) de 17 caracteres. Se encontrado, retorna-o no campo "vin".
2. VEÍCULO/CANAL: Identifica o componente (ex: Injetor 1, Sensor Cambota). 

DIRETRIZES DE LEITURA (CONTEXTO: ${contextVehicle || 'Nova Sessão'}):
1. Extrai estritamente os parâmetros lidos: Duty Cycle, Frequência (Hz), Voltagem Máxima/Mínima.
2. Compara rigorosamente com os valores ideais mecânicos ('2.5ms é o nominal').
3. Classifica como "ok" (igual ao ideal), "warning" (desvio <15%), "error" (>15%).
IMPORTANTE: Terminologia técnica PT-PT.`;
        } else {
            prompt = `ANALISA ESTA IMAGEM DE UM ECRÃ DE SCANNER OBD AUTOMÓVEL.
FOCO EXCLUSIVO EM LER DADOS. NÃO ADICIONES SUGESTÕES DE REPARAÇÃO, DICAS SOBRE COMO TESTAR OU COMO RESOLVER. É uma ferramenta unicamente de extração e análise passiva.

PRIORIDADE MÁXIMA:
1. VIN LOCK & DECODING (EXPERT MODE): Tenta encontrar o VIN (17 caracteres). Se detetado, retorna-o no campo "vin". O campo "vehicle" DEVE SER rigoroso no formato "[Marca] [Modelo] [Motor] ([Ano])".
2. EXTRAÇÃO DE CÓDIGOS DE ERRO (DTC): Extrai todos os códigos de erro listados (ex: P0101, U0100) e as suas descrições diretas para o array \`dtcs\`.
3. TABELA DE DADOS: Extrai exaustivamente todas as linhas numéricas de parâmetros de motores (Live Data).

DIRETRIZES TÉCNICAS E DE TOLERÂNCIA (CONTEXTO: ${contextVehicle || 'Nova Sessão'}):
1. Para cada parâmetro numérico lido, és OBRIGADO a apresentar um \`idealValue\`. Se a máquina de diagnóstico não o mostrar na foto, recorre ao teu conhecimento mecânico fundamental para fornecer o standard nominal teórico (ex: Massa de Ar de um 2.0 TDI ao ralenti ≈ 7 a 9 g/s).
2. REGRA DOS DEZ POR CENTO RACIONAL (CRÍTICO): Usa matemática rígida. Calcula a diferença entre o 'Valor Real Lido' e o 'Valor Ideal Nominal'.
   - Se o desvio for matematicamente superior a 15% (para mais ou para menos), classifica "error". 
   - Se o desvio for entre 5% e 15%, classifica "warning". 
   - Se estiver cravado ou perfeitamente dentro da margem natural, classifica "ok".
3. Nas propriedades \`explanation\`:
   - \`whatIsIt\`: Descreve, num jargão direto de mecânico, qual é a missão/função deste sensor/atuador no motor.
   - \`meaning\`: Explica o que este desvio específico (muito alto ou baixo) fisicamente indica (ex: "Excesso de ar lido indica admissão danificada ou MAF sujo").
IMPORTANTE: Terminologia puramente técnica de garagem em PT-PT.`;
        }

        prompt += `
Responde ESTRITAMENTE num formato JSON válido com a seguinte estrutura, isolando os Erros (dtcs) dos Parâmetros Ténicos:
{
  "vin": "VIN de 17 caracteres ou null",
  "vehicle": "Identificação do Veículo",
  "dtcs": [
    {
      "code": "Código (Ex: P0420)",
      "description": "Descrição formal do erro exibida no scanner"
    }
  ],
  "parameters": [
    {
      "name": "Nome",
      "value": "Valor Lido (com unidade)",
      "numericValue": 123.45,
      "idealValue": "Valor Ideal (com unidade)",
      "numericIdealValue": 120.00,
      "status": "ok" | "warning" | "error",
      "explanation": {
        "whatIsIt": "Definição mecânica seca",
        "meaning": "Significado do valor face à tolerância nominal"
      }
    }
  ],
  "diagnosis": "Resumo global da situação baseado apenas nos números, sem indicar à oficina o que eles devem fazer ou consertar."
}`;

        let text: string | undefined;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: [
                    prompt,
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
                ],
                config: { temperature: 0, responseMimeType: "application/json" }
            });
            text = response.text;
        } catch (e: any) {
            console.warn("Gemini 2.5 Pro indisponível (503) ou erro. Resvalando para gemini-2.5-flash...", e.message);
            const fbResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    prompt,
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
                ],
                config: { temperature: 0, responseMimeType: "application/json" }
            });
            text = fbResponse.text;
        }
        if (!text) throw new Error("A IA devolveu uma resposta vazia.");
        
        const cleanText = text.replace(/```json/i, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanText);
        
        // Memória Hashing: Guardar o resultado na cache
        try {
            await prisma.diagnosticCache.create({
                data: {
                    hash: cacheKey,
                    response: text
                }
            });
        } catch (e) {
            console.error("Erro ao guardar na memória (Cache):", e);
        }

        return parsedResult;
    } catch (error) {
        console.error("Erro no diagnóstico Gemini:", error);
        throw new Error("Falha ao analisar a imagem pela Inteligência Artificial. Verifique a chave ou tente com outra fotografia.");
    }
}
