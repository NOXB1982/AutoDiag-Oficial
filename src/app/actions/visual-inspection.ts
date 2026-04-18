"use server"

import { GoogleGenAI } from '@google/genai';

export async function identifyPart(base64Image: string): Promise<{ data?: any, error?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { error: "A chave GEMINI_API_KEY não está configurada." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const mimeType = base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        
        let prompt = `És um Especialista Automóvel. 
Analisa a imagem desta peça ou componente mecânico/eletrónico.
Identifica o que é numa frase curta. Tenta ler ou inferir a referência se visível.
Responde RIGOROSAMENTE neste formato JSON:
{
  "component": "Nome do Componente (Ex: Válvula de Controlo de Turbo)",
  "reference": "Referência (Ex: Meat & Doria 64001) ou null se não visível"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                }
            ],
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return { error: "A IA não devolveu resposta na primeira fase de identificação." };

        return { data: JSON.parse(text) };
    } catch (error: any) {
        console.error("Erro no módulo Inspection (identify):", error.message || error);
        return { error: "Falha ao identificar o componente. Confirme a nitidez da foto." };
    }
}

export async function analyzePinout(base64Image: string, componentName: string): Promise<{ data?: any, error?: string }> {
    if (!process.env.GEMINI_API_KEY) {
        return { error: "A chave GEMINI_API_KEY não está configurada." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const mimeType = base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        
        // Solicitação rigorosa de Bounding Boxes [ymin, xmin, ymax, xmax] normalizadas a 1000
        let prompt = `O mecânico confirmou que esta foto mostra um/uma "${componentName}".
Com base no teu conhecimento técnico avançado sobre este componente, analisa a foto cuidadosamente.

1. Determina a escala recomendada para o ecrã do Osciloscópio (Voltagem, Tempo). ATENÇÃO REGRA DE OURO: Se este atuador for controlado por Sinal PWM (ex: Eletroválvulas de Turbo, EGR, Reguladoras Rail...), a escala TEM DE SER OBRIGATORIAMENTE '20V' e '5ms/div' fixa!
2. Determina as configurações de Multímetro recomendadas (Modo de Roda Ex: '20V DC' ou 'Resistência 2KΩ') e qual o Valor Numérico de Referência esperado (Ex: 'Aprox. 4.8V' ou '400 a 800 Ohms').
3. Identifica o Tipo de Sinal esperado neste componente (ex: PWM, Sinal Analógico 0-5V, Frequência).
4. EXTRAÇÃO DE ESPAÇO: Deteta visualmente as Bounding Boxes dos PIN TERMINAIS visíveis no formato [ymin, xmin, ymax, xmax] normalizadas de 0 a 1000. ATENÇÃO: Concentra-te EXATAMENTE na ponta metálica de cada pino individual. Se o conector tiver 2 ou 3 pinos, as respetivas caixas (boxes) NÃO SE PODEM SOBREPOR e têm de mapear coordenadas visivelmente separadas.
5. DIAGRAMA LIGAÇÃO: Identifica EXATAMENTE onde o mecânico deve prender as pontas de prova tanto para o Osciloscópio como para o Multímetro.
6. VISÃO PRO (ESTADO FÍSICO): Inspeciona ATENTAMENTE a integridade física da ficha/conector e dos pequenos fiações visíveis na foto. Há sinais de verdete (corrosão cobre)? Fios derretidos ou descarnados/cortados? Sujidade extrema de óleo infiltrado? Retorna o estado aparente.

Responde RIGOROSAMENTE neste formato JSON:
{
  "oscilloscope": {
    "voltage": "Ex: 20V",
    "time": "Ex: 5ms/div"
  },
  "multimeter": {
    "mode": "Ex: 20V DC",
    "expectedValue": "Ex: 5.0V (Alimentação)"
  },
  "signalType": "EX: Sinal PWM com controlo pelo Negativo",
  "componentCondition": "Ex: Visão Pro - Ficha com muito verdete no Pino 2 / Cobre exposto no cabo azul / Bom estado aparente da eletrónica.",
  "connectionSetup": {
    "channelA": "Ex: Inserir agulha no Pino 2 (Cabo do Sinal)",
    "ground": "Ex: Ligar garra jacaré ao Negativo da Bateria ou Bloco Motor",
    "multimeterRed": "Ex: Encostar ponta Vermeha ao Pino 1 (VCC)",
    "multimeterBlack": "Ex: Encostar ponta Preta ao Pino 3 (Massa)"
  },
  "pins": [
    {
      "id": "Pino 1",
      "description": "Função presumível (Ex: Alimentação 12V)",
      "box": [450, 400, 500, 450]
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                }
            ],
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return { error: "A IA não conseguiu gerar o mapeamento das coordenadas." };

        return { data: JSON.parse(text) };
    } catch (error: any) {
        console.error("Erro no módulo Inspection (pinout):", error.message || error);
        return { error: "Falha ao analisar os parâmetros do componente. Tente num ângulo melhor." };
    }
}
