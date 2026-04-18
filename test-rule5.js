// We need to run it in a Next.js environment or mock the AI.
// Since it's difficult to import Next.js server actions directly from a node script,
// I will just use the @google/genai SDK directly with the exact same prompt to see what it outputs.

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let prompt = `És um Engenheiro Eletrotécnico Automóvel de Alta Precisão.
Analisa as fotografias fornecidas contendo esquemas elétricos ou pinagens.
Responde rigorosamente à pergunta do técnico: "Quais são os fios que ligam da egr a ecu"

REGRA DE OURO DE EXTRAÇÃO:
É ABSOLUTAMENTE PROIBIDO dar respostas genéricas ou teóricas (ex: "depende do fabricante", "geralmente o pino 1 é sinal").
Deves ABRIR OS OLHOS e EXTRAIR OS DADOS REAIS diretamente da imagem fornecida. 
Exemplo de precisão esperada: Se te pedem o sensor MAP (B105-I) do Nissan Juke, e a imagem mostra o pino 1 laranja ("og") ligado à VCC e o pino 3 verde ("gn") ligado à massa da ECU A35, tu OBRIGATORIAMENTE tens de me dar essas cores exatas, pinos e destinos extraídos da imagem!

DIRETRIZES DE SAÍDA (Obrigatório retornar APENAS JSON válido):
{
  "sourcePage": 12,
  "boundingBox": [0,0,100,100],
  "analysis": "A tua resposta detalhada em Markdown. Foca toda a resposta APENAS nos dados que extraíste fisicamente das linhas do PDF.",
  "pathTrace": [
    {
      "step": 1,
      "component": "Nome exato",
      "pin": "Pino",
      "color": "Cor",
      "action": "Destino exato lido"
    }
  ]
}

REGRAS ESTABELECIDAS (5 LEIS FÉRREAS DE RASTREIO):
1. **Hierarquia Lexical (Ignorar Isolados):** NUNCA identifiques componentes por números soltos.
2. **Validação Cruzada de Legenda (Anti-presunção):** Ao ler a cor de um cabo (ex: "br"), estás PROIBIDO de assumir a tradução ("castanho") sem confirmar.
3. **Rastreio Geométrico (Pixel-a-Pixel):** Le apenas dentro do retangulo.
4. **Checagem de Sanidade Física (Conservação de Pinos):** Entradas = Saídas.
5. **Mapeamento Semântico Multi-Página (PASSO ZERO):** Quando solicitado um componente pelo nome (ex: "Válvula EGR"), é ILEGAL inferir qual dos desenhos não-marcados corresponde. Deves OBRIGATORIAMENTE varrer as páginas submetidas de "Legenda de Componentes" (onde os códigos e traduções estão listados), descobrir que "EGR" corresponde ao Código Alfanumérico X (ex: Y141) e SÓ DEPOIS olhar para o mapa elétrico para desenhar o \`pathTrace\` a partir desse código estrito.
   - *Instrução Sub-Regra 5:* Deves OBRIGATORIAMENTE declarar na tua \`analysis\` o resultado desta pesquisa com uma frase de auditoria clara (Ex: "Componente X cruzado na legenda local sob o código Y. A iniciar rastreio..."). Se não estiver na legenda, não rastreies.

INSTRUÇÕES FINAIS:
- Preenche a \`pathTrace\` (Legenda Dinâmica) OBRIGATORIAMENTE com estes valores REAIS cruzados, passo-a-passo.
- Se não for legível localmente, indica "N/A" na \`color\`.
- Inclui sempre o aviso final na \`analysis\`: "*Aviso: Pins estritos.*"`;

    console.log("Requesting from Gemini 3.1 Pro...");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: [prompt, "Dummy image reference for testing"],
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });
        console.log("RAW RESPONSE TEXT:");
        console.log(response.text);
    } catch(e) {
        console.error(e);
    }
}
run();
