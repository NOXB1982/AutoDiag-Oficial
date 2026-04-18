import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();
const app = express();
const port = process.env.PORT || 8080;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Multer configured for memory parsing (handling large raw PDFs)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
// Sanity check endpoint for Cloud Run Health Monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Engine Runtime Active', version: '1.0.0' });
});
app.post('/api/v1/analyze', upload.single('document'), async (req, res) => {
    try {
        const { question, contextVehicle, sourcePagesMapping } = req.body;
        const file = req.file;
        if (!file)
            return res.status(400).json({ error: "Documento técnico não fornecido na payload multipart." });
        if (!question)
            return res.status(400).json({ error: "Parâmetro 'question' é obrigatório." });
        if (!process.env.GEMINI_API_KEY)
            throw new Error("GEMINI_API_KEY ausente no ambiente Cloud Run.");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // The core instruction set migrated from Next.js server actions
        let prompt = `És um Especialista em Diagnóstico Automóvel Avançado.
A tua missão é extrair ESTRITAMENTE a pinagem e as cores dos fios referentes ao componente alvo: "${question}".

${contextVehicle ? `Veículo de Contexto Fornecido: ${contextVehicle}\n` : ''}
${sourcePagesMapping ? `MAPA DE PÁGINAS FORNECIDO:
As imagens em anexo correspondem às seguintes páginas originais: [${sourcePagesMapping}]. A primeira imagem é a página respetiva, etc.\n` : ''}

INSTRUÇÕES DO PENSAMENTO VISUAL DE ALTA PRECISÃO:
1. PESQUISA ALVO: Recebeste o diagrama físico nativo (PDF Vetorial Lossless). Varre o documento original e localiza a secção exata do alvo (ex: "${question}"). 
2. A TUA AMNÉSIA MECÂNICA (VITAL!): O teu treino maciço em engenharia automóvel e normas DIN 72551 (onde massa/ground é sempre castanho 'br') está a envenenar a tua visão. É ESTRITAMENTE PROIBIDO assumires que um fio de pulso de massa da ECU tem a cor 'br' só porque a lógica alemã o exige. 
3. CONFIANÇA CEGA NO OCR: Os construtores violam a norma frequentemente. Se no papel estiver escrtio nitidamente o código 'rt' (vermelho), tu TENS de escrever 'rt', mesmo que o teu instinto mecânico grite que isso devia ser alimentação e não pulso! Não deduzas, apenas TRANSCREVE de forma pura os vetores originais impressos no esquema, mesmo que sejam 'rt sw', 'rt gn', 'rt gr'.
4. ISOLAMENTO ABSOLUTO: Foca-te ÚNICA e EXCLUSIVAMENTE nas linhas que entram/saem fisicamente do componente isolado. Ignora componentes adjacentes perentoriamente. Anota os Pinos de destino (ex: ECU) e a Cor EXATA transcrita.
5. TRADUÇÃO ISO: [rt=Vermelho | bl=Azul | sw=Preto | gn=Verde | gr=Cinzento | ws=Branco | br=Castanho | vi=Roxo | ge=Amarelo | li=Lilás | rs=Rosa | nf=Incolor].

DIRETRIZES DE SAÍDA OBRIGATÓRIAS (APENAS JSON VÁLIDO):
Devolve o teu raciocínio livre incapsulado exatamente nesta estrutura JSON compatível com a nossa UI, para podermos desenhar gráficos bonitos:
{
  "analysis": "Explica de forma coloquial e em Português de Portugal quais são os pinos do componente, a cor do(s) fio(s) que sai(em) desse pino, e para onde vão (ex: PIN 5 da centralina, Massa partilhada, etc.). Inclui na resposta a função teórica de cada pino (massa, sinal, injetor I, injetor II, alimentação, controlo). Escreve cerca de 2 parágrafos. Não te alongues em avisos genéricos.",
  "pathTrace": [
     {
       "componentPinName": "Pino 1 (Ex: Alimentação / Injetor I / Sensor +)",
       "wireFeatureColor": "COR PT (código EN)",  // Ex: Vermelho/Preto (rt sw) // Respeitar sempre o traduço ISO!
       "destinationName": "ECU pino X"
     }
  ]
}
Atenção: A resposta DEVE ser estritamente JSON. Não incluas tiques de blocos de markdown (\`\`\`json) no texto final, apenas as chavetas.`;
        const inlineData = {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype // Will correctly inject 'application/pdf' Native vector mode
        };
        console.log('[Gemini VLM Engine] Invoking Native PDF Vector Scan with Payload:', file.size, 'bytes');
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [prompt, { inlineData }],
            config: {
                temperature: 0.0,
                responseMimeType: "application/json"
            }
        });
        const text = response.text || "{}";
        let payload;
        try {
            payload = JSON.parse(text);
            if (Array.isArray(payload))
                payload = payload[0];
        }
        catch (err) {
            return res.status(500).json({ error: "IA Error Parsing Response", raw: text });
        }
        res.status(200).json({ data: payload });
    }
    catch (error) {
        console.error("[Cerebral Core Failure]", error);
        res.status(500).json({ error: error.message || "Erro fatal interno do servidor Cloud Run" });
    }
});
app.listen(port, () => {
    console.log(`Autodiag Neural Master Engine listening on port \${port}\`);
});
    );
});
