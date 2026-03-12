"use server"

import { GoogleGenAI } from '@google/genai';

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

        let prompt = ``;
        if (type === "osciloscopio") {
            prompt = ` ANALISA ESTA IMAGEM DE UM ECRÃ DE OSCILOSCÓPIO LIGADA AOS COMPONENTES DE UM MOTOR AUTOMÓVEL.

PRIORIDADE MÁXIMA DE IDENTIFICAÇÃO:
1. CURSO DO VIN: Tenta identificar o Número de Identificação do Veículo (VIN) de 17 caracteres. Se encontrado, retorna-o no campo "vin".
2. VEÍCULO/CANAL: Identifica o componente (ex: Injetor 1, Sensor Cambota). Se não visível, escreve "Desconhecido".

DIRETRIZES DE DIAGNÓSTICO AVANÇADO (CONTEXTO: ${contextVehicle || 'Nova Sessão'}):
1. Foco em Atuadores: Se sinal de atuador (PWM), analisa o Duty Cycle e a Frequência (Hz).
2. Diagnóstico Comparativo: Explica o valor com lógica mecânica (ex: '5% na EGR ao ralenti indica válvula fechada').
3. Identificação de Falhas Físicas: Procura picos de tensão ou deformações (desgaste solenoide ou resistência excessiva).
4. Linguagem Técnica: Curto e direto, fornece SEMPRE valores de referência (ex: '2.5ms é ideal').

Para cada sinal, responde no formato: 1) O que é? 2) Significado? 3) O que verificar?
Classifica como "ok", "warning", ou "error". Diagnóstico global descreve se o sistema está normal.
IMPORTANTE: Terminologia técnica PT-PT.
`;
        } else {
            prompt = `
 ANALISA ESTA IMAGEM DE UM ECRÃ DE SCANNER AUTOMÓVEL.

PRIORIDADE MÁXIMA DE IDENTIFICAÇÃO:
1. VIN LOCK & DECODING (EXPERT MODE): Tenta encontrar o VIN (17 caracteres). Se detetado, retorna-o no campo "vin". 
   - REGRAS DE ESPECIALISTA: Usa obrigatoriamente o 10º dígito para o Ano (ISO 3779) e a secção VDS (posições 4-9) para determinar Motorização/Cilindrada.
   - PROIBIÇÃO: Se o VIN for válido, É PROIBIDO devolver "desconhecido" no ano ou motor. Fornece a estimativa técnica mais provável baseada na tua base de conhecimento interna.
   - Padrão de Nome (OBRIGATÓRIO): O campo "vehicle" deve ser "[Marca] [Modelo] [Cilindrada/Motor] ([Ano])" (ex: "VW Golf 1.6 TDI (2018)").
   - CRUZAMENTO VISUAL: Usa logótipos físicos, etiquetas no chassi ou dados no ecrã do scanner visíveis na foto como confirmação redundante ao VIN.
   - Se não houver VIN, tenta identificar o máximo de dados técnicos pela imagem mantendo o padrão de nome.
2. TABELA DE DADOS: Varre exaustivamente todas as linhas do scanner (Autel, TEXA, etc).

DIRETRIZES TÉCNICAS (CONTEXTO: ${contextVehicle || 'Nova Sessão'}):
${contextVehicle ? 'FOCO 100% EM DADOS: O veículo já está identificado. Concentra-te exclusivamente na extração de parâmetros técnicos e na comparação com valores ideais.' : ''}
1. Dicionário de Parâmetros: Para cada linha, divide em: "O que é", "O que faz", "Dica de Diagnóstico".
2. REGRA DOS 15% (CRÍTICO): Compara o 'Valor Real' com o 'Valor Ideal'. 
   - Se o desvio for SUPERIOR a 15% (para cima ou para baixo), classifica obrigatoriamente como "error".
   - JUSTIFICAÇÃO: Se for "error", o campo "meaning" deve começar por uma nota de 1 linha explicando o desvio (ex: 'Pressão de turbo abaixo do esperado para 2500rpm').
3. Estilo Limpo: Usa tópicos/bullet points para legibilidade total em tablets.
4. Classificação: "ok" apenas se o valor real bater com o ideal/teórico. "warning" para desvios leves (<15%). "error" para desvios >15%.

Para cada parâmetro, responde: 1) O que é? 2) O que faz? 3) Justificação do Desvio.
Classifica como "ok", "warning", ou "error". Diagnóstico global em tópicos detalhando o que a oficina deve verificar.
IMPORTANTE: Terminologia técnica PT-PT.
`;
        }

        prompt += `
Responde ESTRITAMENTE num formato JSON válido com a seguinte estrutura, sem blocos de código markdown extra em volta:
{
  "vin": "VIN de 17 caracteres ou null",
  "vehicle": "Identificação do Veículo",
  "parameters": [
    {
      "name": "Nome",
      "value": "Valor (com unidade)",
      "numericValue": 123.45, // VALOR NUMÉRICO PURO PARA GRÁFICOS (null se não for número)
      "idealValue": "Ideal/Nominal (com unidade)",
      "numericIdealValue": 120.00, // VALOR NUMÉRICO PURO PARA GRÁFICOS (null se não for número)
      "status": "ok" | "warning" | "error",
      "explanation": {
        "whatIsIt": "Definição",
        "meaning": "Significado",
        "whatToCheck": "Verificações físicas"
      }
    }
  ],
  "diagnosis": "Diagnóstico global em tópicos"
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
