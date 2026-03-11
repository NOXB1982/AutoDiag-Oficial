"use server"

import { GoogleGenAI } from '@google/genai';

export async function diagnoseImage(base64Image: string, type: "obd" | "osciloscopio" = "obd") {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("A chave GEMINI_API_KEY não está configurada no ambiente.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        // base64Image comes as "data:image/jpeg;base64,...", need to strip the prefix
        const base64Data = base64Image.split(',')[1];

        let prompt = ``;
        if (type === "osciloscopio") {
            prompt = `
Analisa esta imagem de um ecrã de osciloscópio ligada aos componentes de um motor automóvel.
Primeiro, se visível na interface do software (no cabeçalho ou nas abas), tenta identificar o Veículo ou o Canal do componente (ex: Injetor 1, Sensor Cambota). Se não for visível, escreve "Veículo não especificado".
Depois, extrai os parâmetros visíveis na imagem: ciclo de trabalho (PWM), tensão máxima (picos de tensão), frequência, e identifica padrões de ondas típicos (ex: sinais de sensores Hall, indutivos, piezo).
Para cada parâmetro ou padrão extraído, gera uma explicação curta respondendo a: 
1) O que é? (ex: Pico de tensão do injetor)
2) O que significa este valor? (Compara a onda/valor lido com os valores teóricos de referência, ex: 'Pico de tensão de 80V num injetor piezo é normal').
3) O que verificar? (Causas prováveis de anomalias na onda: resistência elevada, curto-circuito, módulo de comando).
Classifica o estado do sinal como "ok" (verde, onda padrão normal), "warning" (amarelo, onda com ligeiro ruído ou desvio), ou "error" (vermelho, onda totalmente deformada ou fora de escala).
Faz o diagnóstico global descrevendo se o sinal elétrico ou do sensor se encontra dentro da normalidade para esse tipo de sistema de injeção/ignição.
IMPORTANTE: Usa terminologia técnica de eletrónica automóvel em Português de Portugal.
`;
        } else {
            prompt = `
Primeiro, lê o cabeçalho no topo da imagem para identificar o Veículo (Marca/Modelo/Ano/Motor).
Nas linhas seguintes, extrai todos os parâmetros técnicos visíveis no resto do ecrã do scanner OBD.
Para cada parâmetro extraído (ex: EGR Duty Cycle, Turbo Boost), gera uma explicação curta respondendo a: 
1) O que é? 
2) O que significa este valor? (Comparando o valor lido com os valores ideais do fabricante)
3) O que verificar? (Causas prováveis: cablagem, fuga de vácuo, etc).
Classifica o estado do parâmetro como "ok" (verde, dentro do esperado), "warning" (amarelo, fora do ideal leve), ou "error" (vermelho, erro grave).
Faz o diagnóstico comparativo global baseado nos dados técnicos oficiais desse motor.
IMPORTANTE: Usa terminologia técnica de mecânica em Português de Portugal (ex: 'centralina', 'gasóleo', 'borboleta', 'coletor', 'ralenti').
`;
        }

        prompt += `
Responde ESTRITAMENTE num formato JSON válido com a seguinte estrutura, sem blocos de código markdown extra em volta:
{
  "vehicle": "Identificação do Veículo",
  "parameters": [
    {
      "name": "Nome do Parâmetro",
      "value": "Valor lido (com unidade)",
      "idealValue": "O valor ou faixa ideal de fábrica para este motor",
      "status": "ok" | "warning" | "error",
      "explanation": {
        "whatIsIt": "A definição do que é este parâmetro",
        "meaning": "O que indica este valor face ao esperado",
        "whatToCheck": "O que verificar fisicamente na oficina se for um erro ou warning. String vazia se estiver ok."
      }
    }
  ],
  "diagnosis": "Texto corrido com o diagnóstico mecânico global"
}
`;

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
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) throw new Error("A IA devolveu uma resposta vazia.");

        return JSON.parse(text);
    } catch (error) {
        console.error("Erro no diagnóstico Gemini:", error);
        throw new Error("Falha ao analisar a imagem pela Inteligência Artificial. Verifique a chave ou tente com outra fotografia.");
    }
}
