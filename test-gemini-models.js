const { GoogleGenAI } = require('@google/genai');

const apiKey = "AIzaSyD6FxXnezn31SOzIDJiacvop8yUtwGvpNU"; 
const ai = new GoogleGenAI({ apiKey });

async function run() {
    try {
        console.log("Listing models...");
        const response = await ai.models.list();
        for await (const model of response) {
             console.log(model.name);
        }
    } catch (e) {
        console.error("Gemini Error:", e.message || e);
    }
}

run();
