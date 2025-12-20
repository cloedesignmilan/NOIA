
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: '.env.local' });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing Gemini API...");

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in .env.local");
        return;
    }
    console.log("✅ API Key found (starts with: " + apiKey.substring(0, 5) + "...)");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        console.log("Sending simple text prompt...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("✅ Response received:", response.text().trim());

        // Test with a dummy image (optional, but good if we had one)
        // For now, text confirms API access and Model existence.

    } catch (error) {
        console.error("❌ Gemini API Error:", error.message);

        // Try to list models
        try {
            console.log("Listing available models...");
            // Hacky fetch because SDK listModels might throw same auth error if key is bad, but let's try direct fetch
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const listJson = await listRes.json();
            if (listJson.models) {
                console.log("AVAILABLE MODELS:");
                listJson.models.forEach(m => console.log(" - " + m.name));
            } else {
                console.error("Could not list models:", JSON.stringify(listJson));
            }
        } catch (listErr) {
            console.error("List Models Failed:", listErr.message);
        }
    }
}

testGemini();
