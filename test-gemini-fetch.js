require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

async function testFetch() {
    console.log("Testing raw fetch to Gemini 1.5 Flash...")
    try {
        const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${process.env.GEMINI_API_KEY}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Responde apenas 'Sim funciona'" }] }]
            })
        })
        const data = await res.json()
        console.log("Response:", JSON.stringify(data, null, 2))
    } catch(e) {
        console.error("Fetch error:", e)
    }
}

testFetch()
