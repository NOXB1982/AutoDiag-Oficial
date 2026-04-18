const { GoogleGenAI } = require('@google/genai');

async function testGeminiJsonSanitization() {
    console.log("Iniciando Teste Clínico Simulado do VLM Gemini...");
    
    // Fallback key just for the test
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("FALHA: GEMINI_API_KEY não encontrada no processo!");
        return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Mock an OBD scanner image (1x1 white pixel in base64) - Gemini works purely via prompt structure anyway if no real data is there
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const contextVehicle = "Carro com VIN 12345678901234567, Opel Corsa";

    const prompt = `ANALISA ESTA IMAGEM DE UM ECRÃ DE SCANNER OBD AUTOMÓVEL.
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
IMPORTANTE: Terminologia puramente técnica de garagem em PT-PT.

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

    try {
        console.log("A Invocar API Gemini 1.5 Pro com Response MimeType 'application/json'...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/png'
                    }
                }
            ],
            config: {
                temperature: 0,
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        console.log("Resposta Bruta Recebida da API (Length):", text?.length);
        
        console.log("=== INICIO DA SANITIZAÇÃO JSON (O MEU BUGFIX) ===");
        const cleanText = text.replace(/```json/i, '').replace(/```/g, '').trim();
        
        console.log("A simular Parse JSON...");
        const parsedResult = JSON.parse(cleanText);
        console.log("✅ PARSE SUCESSO! A estrutura é perfeitamente compatível.");
        console.log("------------------------");
        console.log("Extrato Parâmetros lidos:", parsedResult.parameters?.length || 0);
        console.log("Veículo Inferido:", parsedResult.vehicle);
    } catch (e) {
        console.error("❌ ERRO NO TESTE:", e.message);
    }
}

testGeminiJsonSanitization();
