
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing API configuration" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const prompt = `
        Analyze this receipt image and extract the following data in strict JSON format:
        {
            "amount": number (total amount, use period for decimals),
            "date": string (YYYY-MM-DD format),
            "description": string (merchant name or brief description),
            "category": string (guess the most appropriate category from: "Ristorante", "Benzina", "Ufficio", "Marketing", "Software", "Viaggi", "Altro")
        }
        
        If you cannot read a value, set it to null.
        RETURN ONLY THE JSON. NO MARKDOWN.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // Cleanup response (sometimes AI adds markdown)
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanJson);

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Receipt Analysis Failed:", error);

        let errorMessage = error.message || "Unknown error";
        let status = 500;

        // Smart handling for Rate Limits
        if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
            errorMessage = "Il sistema AI è momentaneamente occupato. Riprova tra 30 secondi.";
            status = 429;
        }

        return NextResponse.json(
            { error: "Analysis Failed", details: errorMessage },
            { status: status }
        );
    }
}


