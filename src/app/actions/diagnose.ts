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

DIRETRIZES DE DIAGNÓSTICO AVANÇADO:
1. Foco em Atuadores: Sempre que detetares um sinal de atuador (PWM), analisa obrigatoriamente o Duty Cycle e a Frequência (Hz).
2. Diagnóstico Comparativo: A explicação do valor deve usar lógica mecânica avançada (ex: 'Um Duty Cycle de 5% na EGR ao ralenti indica que a válvula está fechada, o que é o esperado. Se subir para 50% sem aceleração, há um erro de comando.').
3. Identificação de Falhas Físicas: Procura ativamente por "picos de tensão anormais" ou deformações que indiquem desgaste na solenoide (indutância comprometida) ou resistência excessiva nos contactos/cablagem.
4. Linguagem Técnica Pedagógica: Sê direto e curto, mas fornece SEMPRE valores de referência como argumento (ex: 'O tempo de injeção de 2.5ms é ideal para este regime', ou 'O pico de indução primária deve atingir cerca de 80V a 100V num injetor deste tipo').

Para cada parâmetro ou padrão extraído, responde exatamente no formato pedido:
1) O que é? (O nome técnico da grandeza elétrica/onda).
2) O que significa este valor? (Aplicação das Diretrizes 2 e 4 - comparação técnica com valores ideais).
3) O que verificar? (Causas prováveis, aplicando a Diretriz 3 - diagnóstico de hardware, módulo ou resistências).
Classifica o estado do sinal como "ok" (verde, onda padrão normal), "warning" (amarelo, onda com ligeiro ruído ou desvio), ou "error" (vermelho, onda totalmente deformada ou fora de escala).
Faz o diagnóstico global descrevendo se o sinal elétrico se encontra dentro da normalidade para o sistema injetado/ignição.
IMPORTANTE: Usa terminologia técnica de eletrónica automóvel estrita em Português de Portugal.
`;
        } else {
            prompt = `
Primeiro, lê o cabeçalho no topo da imagem para identificar o Veículo (Marca/Modelo/Ano/Motor).
Nas linhas seguintes, extrai todos os parâmetros técnicos visíveis no resto do ecrã do scanner OBD2.

DIRETRIZES TÉCNICAS (Modo Scanner):
1. Foco em Atuadores & Regimes: Ao leres Duty Cycle, Posições (%) ou Pressões, correlaciona essa leitura com o estado de Funcionamento do motor se lido (ex: Ralenti, Rotação Alta).
2. Diagnóstico Comparativo: Explica o significado prático. Ex: 'Um Duty Cycle de 5% na EGR ao ralenti indica válvula fechada (normal). 50% em ralenti aponta para erro de comando ou falha da válvula.'
3. Falhas Físicas: Sugere avaliações elétricas/físicas reais (ex: medir continuidade se ler 0V permanente ou resistência alta).
4. Linguagem Pedagógica: Curta, com valores de referência ideais inseridos (ex: 'Pressão de Rail em 250 bar (25 MPa) é perfeita para ralenti de common-rail.').

Para cada parâmetro extraído (ex: EGR Duty Cycle, Turbo Boost), gera uma explicação curta respondendo a: 
1) O que é?
2) O que significa este valor? (Aplicação da Diretriz 2 e 4 - Comparar com fábrica).
3) O que verificar? (Aplicação da Diretriz 3 - cablagem, fuga de vácuo, fusíveis, relés, avaria mecânica).
Classifica o estado do parâmetro como "ok", "warning", ou "error".
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
