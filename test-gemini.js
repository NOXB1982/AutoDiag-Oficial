const { GoogleGenAI } = require('@google/genai')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

async function test() {
    try {
        const response1 = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello'
        })
        console.log("gemini-2.5-flash OK:", response1.text)
    } catch (e) {
        console.error("2.5-flash erro:", e.message)
    }
}
test()
