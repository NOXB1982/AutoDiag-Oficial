const { GoogleGenAI } = require('@google/genai');

const apiKey = "AIzaSyD6FxXnezn31SOzIDJiacvop8yUtwGvpNU"; // Mocked temporarily from .env
const ai = new GoogleGenAI({ apiKey });

async function run() {
    try {
        console.log("Calling gemini...");
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [
                "Summarize this image in one word",
                {
                    inlineData: {
                        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 1x1 black pixel
                        mimeType: 'image/png'
                    }
                }
            ]
        });
        console.log("Success:", response.text);
    } catch (e) {
        console.error("Gemini Error:", e.message || e);
    }
}

run();
