"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const genai_1 = require("@google/genai");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
// Multer configured for memory parsing (handling large raw PDFs)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // The 3-Stage Algorithmic Master Prompt (DIN Current Track Spatial Tunneling)
        let prompt = `Você é um Especialista de Informação Técnica Automóvel. A sua tarefa é decifrar esquemas elétricos complexos (DIN norm) de forma estritamente determinística e matemática, para o alvo: "${question}".
    
${contextVehicle ? `Veículo de Contexto Fornecido: ${contextVehicle}\n` : ''}
${sourcePagesMapping ? `MAPA DE PÁGINAS FORNECIDO:
As imagens em anexo correspondem às seguintes páginas originais: [${sourcePagesMapping}]. A primeira imagem é a página principal, prestando especial atenção aos Índices ou Legendas de Localização incluídos nas restantes.\n` : ''}

Irá aplicar o seguinte algoritmo de 3 Fases SEQUENCIAIS (Nunca decida pinos à pressa sem cumprir as fases):

FASE 1 - LOCALIZAÇÃO POR COORDENADA (LEGENDA DO PDF):
1. Verifique inicialmente as páginas de Índice / Componentes / Legendas.
2. Identifique o componente alvo exato (ex: Y3, K46).
3. Registe a Coordenada Espacial ou 'Current Track' (números no rodapé da folha de desenho) que a legenda indica para este componente (ex: Pista 12-15).

FASE 2 - TÚNEL DE CONFINAMENTO ESPACIAL VISUAL (CRÍTICO!):
1. Transite mentalmente para a folha principal do esquema (com linhas, intersecções e caixas).
2. Fixe a sua análise VETORIAL APENAS na coluna vertical (X-Axis) correspondente à Pista assinalada na Fase 1.
3. Se o seu alvo (ex: Injetores Y3) estiver na Pista 12 a 15, IGNORE e AMAZZONE por completo componentes adjacentes grafados noutras pistas (ex: Bobina T1 na Pista 16+). A atração por blocos fisicamente majestosos fora da sua pista é o seu maior erro potencial.

FASE 3 - RASTREIO DE CABLAGEM MÍOPE (DESCIDA Y-AXIS):
1. Dentro do seu estrito Túnel Horizontal (Pista X), centre a atenção nas caixas do seu alvo (ex: Y3-I, Y3-II).
2. Comece no pino isolado da peça alvo e siga as linhas/fios que O CRUZAM para fora do componente.
    - Anote o código/número do Pino no alvo (ex: 2).
    - Leia NATIVAMENTE (OCR) as letras adjacentes à linha vetorial e obedeça imperativamente a ISO: [rt=Vermelho | bl=Azul | sw=Preto | gn=Verde | gr=Cinzento | ws=Branco | br=Castanho | vi=Roxo | ge=Amarelo]. Ex: 'br bl' = Castanho/Azul.
    - Percorra a malha de desenho descendo a pista até a linha colidir num módulo comandante (habitualmente ECU - ex: A35).
    - LEITURA DE FRONTEIRA: Apenas o número escrito CORTANDO ou roçando na fronteira retangular desse módulo destino indica o Pino (ex: 10, 42). Fios de outros painéis que se intersecionam a meio do caminho não lhe pertencem.

SAÍDA REQUERIDA (O formato JSON é crucial, não o quebre com blocos de markdown no texto final):
{
  "analysis": "Documente como o algoritmo foi executado: Descreva a indicação encontrada na legenda do esquema, qual a pista/track de rodapé que determinou, o constrangimento espacial (que peças ignorou adjacentes), e as cores e vias descobertas na descolagem Y para o componente destino. Use português lusitano formal.",
  "pathTrace": [
     {
       "step": 1,
       "component": "Nome Técnico Exato da Peça Encontrada (Ex: Injetor 1 Y3-I)",
       "pin": "Apenas PINO DE SAÍDA (Ex: 1, 2)",
       "color": "Cor Extensa PT + ISO Original (Ex: Castanho/Branco - br ws)",
       "action": "Destino lógico definitivo (Ex: ECU A35 Pino 34)"
     }
  ]
}`;
        const inlineData = {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype // Will correctly inject 'application/pdf' Native vector mode
        };
        console.log('[Gemini VLM Engine] Invoking Native PDF Vector Scan with Payload:', file.size, 'bytes');
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-002',
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
    console.log(`Autodiag Neural Master Engine listening on port ${port}`);
});
