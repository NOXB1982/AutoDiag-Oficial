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
Primeiro, lê o cabeçalho no topo da imagem para tentar identificar o Veículo (Marca/Modelo/Ano/Motor).
Nas linhas seguintes, efetua o RECONHECIMENTO DE TABELA: Varre exaustivamente todas as linhas de parâmetros listadas no scanner de diagnóstico (ex: ecrãs Autel, TEXA, Launch).

DIRETRIZES TÉCNICAS (Modo Scanner - Dicionário Técnico):
1. Dicionário Técnico de Parâmetros: Para cada linha detetada no scanner deves dividir a explicação em três tópicos estritos:
   - "O que é:" (Função básica do componente).
   - "O que faz:" (Como atua ou o que indica no motor em tempo real).
   - "Dica de Diagnóstico:" (O que significa se estiver muito alto ou muito baixo).
2. Análise de Desvio: Cruza imediatamente qualquer discrepância se a máquina mostrar colunas de 'Alvo / Desired' contra 'Real / Actual'. Foca o teu diagnóstico na diferença entre as duas (ex: 'Alvo de Rail 300 bar, Real de 150 bar -> Pressão nominal não atingida, verificar bomba ou fugas').
3. Estilo de Resposta Limpo: Usa sempre quebras de linha e formatação em tópicos (bullet points ou hífens) quer dentro das explicações da chave JSON, quer no campo que aloja o teu diagnóstico global, para que fique estético no telemóvel do mecânico.
4. Classificação Rigorosa: Só dás estado "ok" se o valor real bater certo com o teórico ou alvo.

Para cada parâmetro extraído (ex: EGR Duty Cycle, Rail Pressure, Short Term Fuel Trim), responde exatamente neste formato:
1) O que é?
2) O que faz?
3) Dica de Diagnóstico e Análise do Desvio (Diretrizes 2 e 3).

Classifica o estado do parâmetro como "ok", "warning", ou "error".
Faz o diagnóstico comparativo global em formato de tópicos (bullet points), listando os pontos-chave a verificar pela oficina no carro físico.
IMPORTANTE: Usa terminologia técnica de reparação em Português de Portugal.
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
