
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// System Prompts configuration
const SYSTEM_PROMPTS = {
    listing: `Sei un copywriter immobiliare d'élite.
  Il tuo obiettivo è scrivere descrizioni PRONTE ALL'USO per portali immobiliari.
  
  REGOLE FONDAMENTALI DI FORMATTAZIONE (Strict):
  1. NESSUN MARKDOWN: Non usare grassetti (**), corsivi (*) o altri simboli. Solo testo pulito.
  2. NESSUNA ETICHETTA: Non scrivere "Titolo:", "Descrizione:", "CTA:", ecc. Scrivi direttamente il contenuto.
  3. PRONTO DA INCOLLARE: Il testo deve sembrare scritto a mano da un umano, pronto per essere copiato su Idealista/Casa.it.
  
  STRUTTURA (Separata da righe vuote):
  [Titolo Emozionale in Maiuscolo/Minuscolo, non tutto maiuscolo]
  
  [Paragrafo Gancio: Domanda o beneficio diretto]
  
  [Elenco puntato semplice con trattini - per le caratteristiche]
  - Caratteristica 1
  - Caratteristica 2
  
  [Conclusione con CTA diretta e numeri di telefono/riferimenti generici]`,

    blog: `Sei un esperto SEO e content writer. Scrivi articoli pronti per essere pubblicati.
  
  REGOLE DI FORMATTAZIONE (Clean Text):
  1. NESSUN MARKDOWN: Non usare # per i titoli, niente **, niente corsivi.
  2. STRUTTURA VISIVA: Usa solo il tasto invio per separare i paragrafi. Usa MAIUSCOLO per i titoli dei paragrafi se necessario.
  3. SENZA LABELS: Non scrivere "Titolo:", "Introduzione:", ecc.
  4. LIVELLO: Scrittura fluida, professionale, divisa in paragrafi leggibili.
  
  Obiettivo: L'utente deve poter copiare il testo e incollarlo su WordPress/Word senza dover rimuovere simboli strani.`,

    social: `Sei un social media manager specializzato in Real Estate.
  Scrivi copy per Meta Ads (Facebook/Instagram).
  
  Regole:
  - Crea 3 varianti: A (Storytelling/Problema-Soluzione), B (Urgenza/Scarsità), C (Autorità/Social Proof).
  - Usa emoji in modo strategico ma non eccessivo.
  - Rispetta le policy Meta (niente promesse di guadagno irrealistiche o discriminazione).
  
  OUTPUT FORMAT:
  Restituisci ESCLUSIVAMENTE un JSON Array valido.
  Struttura:
  [
    {
      "type": "Variante A: Storytelling",
      "hook": "Testo dell'hook...",
      "body": "Testo del corpo...",
      "cta": "Testo della CTA..."
    },
    ...
  ]`,

    "news-discovery": `Sei un analista di mercato immobiliare italiano aggiornato.
  Il tuo compito è trovare 6 notizie o trend attuali (ultimi mesi) rilevanti per il mercato immobiliare in Italia (mutui, prezzi case, normative green, affitti brevi, ecc).
  
  OUTPUT FORMAT: JSON Array puro.
  Non usare markdown. Non usare backticks.
  Struttura:
  [
    {
      "id": 1,
      "title": "Titolo breve e accattivante della notizia",
      "summary": "Riassunto di 2 righe del contenuto.",
      "source": "Fonte generica (es. Il Sole 24 Ore, Idealista News, Nomisma)"
    }
  ]`,

    rewrite: `Sei un ghostwriter professionista.
  Il tuo obiettivo è riscrivere una notizia esistente per trasformarla in un contenuto originale, autorevole e NON plagiato.
  
  REGOLE:
  1. Cambia completamente la struttura delle frasi.
  2. Mantieni i fatti e i dati, ma cambia il tono (rendilo più discorsivo e analitico).
  3. Aggiungi un tuo commento o una prospettiva per l'agente immobiliare/investitore.
  4. Formato PULITO (no markdown, no labels).`,

    "image-prompt": `Sei un Art Director specializzato in Real Estate e Fotografia d'Architettura.
  Il tuo compito è scrivere un prompt IN INGLESE perfetto per generare un'immagine fotorealistica.
  
  INPUT: Argomento immobiliare.
  OUTPUT: Solo il prompt in inglese.
  
  REGOLE CRUCIALI (NO TEXT RISK):
  1. STILE: "Award-winning architectural photography, shot on Sony A7R IV, 8k, ultra-detailed, photorealistic".
  2. ATMOSFERA: "Cinematic lighting, golden hour or soft daylight, clean, modern, luxury focus, depth of field".
  3. CONTENUTO (Visivo, NON Concettuale a rischio testo):
     - Mutui/Finanza -> "Modern glass skyscraper reaching the sky, blue tones, reflection, minimal aesthetic" (EVITA documenti/calcolatrici).
     - Ristrutturazioni -> "Bright empty room with white walls, wooden ladder, buckets of white paint, soft sunlight" (EVITA planimetrie).
     - Vendita/Marketing -> "Stunning modern luxury villa with infinity pool, sunset, warm lights, manicured garden" (EVITA cartelli vendesi).
     - Generico -> "Minimalist modern living room, white sofa, large windows, view of nature".
  4. NEGATIVE PROMPT (Integrato): "text, watermark, logo, word, letter, signature, blurry, low resolution, deformed".
  5. FORMATO: Solo il prompt descrittivo.`
};

export async function POST(req: Request) {
    let effectiveKey = process.env.GEMINI_API_KEY || "";

    try {
        const body = await req.json();
        const { promptType, data, apiKey: userApiKey } = body;

        if (userApiKey) {
            effectiveKey = userApiKey;
        }

        if (!effectiveKey) {
            return NextResponse.json(
                { error: "API Key mancante. Inseriscila nelle impostazioni o configura GEMINI_API_KEY nel server." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(effectiveKey);

        if (!promptType || !SYSTEM_PROMPTS[promptType as keyof typeof SYSTEM_PROMPTS]) {
            return NextResponse.json({ error: "Tipo di prompt non valido" }, { status: 400 });
        }

        // Candidate models to try in order of preference (Updated based on user access)
        const candidateModels = [
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-2.0-pro-exp",
            "gemini-1.5-flash",
            "gemini-pro"
        ];

        let lastError = null;
        let text = "";
        let success = false;

        // Try models sequentially
        for (const modelName of candidateModels) {
            try {
                console.log(`Attempting with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Construct the full prompt
                const systemInstruction = SYSTEM_PROMPTS[promptType as keyof typeof SYSTEM_PROMPTS];
                let userPrompt = "";

                if (promptType === 'listing') {
                    userPrompt = `INPUT PER DESCRIZIONE IMMOBILE:
                
                Tipo: ${data.type}
                Posizione/Zona: ${data.zone}
                Dati Tecnici: ${data.sqm} mq, ${data.rooms} locali.
                Caratteristiche e "Wow Factor": ${data.features}
                Tono Richiesto: ${data.tone}
                
                Genera la descrizione in formato PULITO, senza markdown (*), senza etichette (Titolo: ecc), pronta per il copia-incolla.`;
                } else if (promptType === 'blog') {
                    userPrompt = `Argomento: ${data.topic}
                Target: ${data.target}
                Keywords: ${data.keywords}
                Extra Info/Fonti: ${data.source}
                
                Scrivi l'articolo in formato PULITO (no markdown, no simboli), pronto da pubblicare.`;
                } else if (promptType === 'social') {
                    userPrompt = `Obiettivo Campagna: ${data.goal}
                Oggetto (Immobile/Servizio): ${data.subject}
                Dettagli Offerta: ${data.details}
                Leva emotiva: ${data.hook}
                
                Genera le 3 varianti di copy in formato JSON.`;
                } else if (promptType === 'news-discovery') {
                    userPrompt = `Genera la lista delle 6 notizie immobiliari/finanziarie del momento in Italia in formato JSON array.`;
                } else if (promptType === 'rewrite') {
                    userPrompt = `Notizia Originale:
                    Titolo: ${data.title}
                    Contenuto/Riassunto: ${data.summary}
                    
                    Riscrivi questo contenuto in un articolo originale, pronto per il blog (Formato PULITO).`;
                } else if (promptType === 'image-prompt') {
                    userPrompt = `Genera un prompt per immagine di copertina basato su questo argomento: "${data.topic}".`;
                }

                const result = await model.generateContent([systemInstruction, userPrompt]);
                const response = await result.response;
                text = response.text();

                // FORCE CLEANUP: Remove markdown symbols explicitly
                if (promptType === 'listing' || promptType === 'blog' || promptType === 'rewrite') {
                    text = text
                        .replace(/\*\*/g, '')   // Remove bold
                        .replace(/^#+\s/gm, '') // Remove headers (# Title)
                        .replace(/`/g, '')      // Remove inline code
                        .replace(/^\s*-\s/gm, '• ') // Convert markdown list dash to bullet for better copy-paste
                        .replace(/\[.*?\]/g, '') // Remove [Labels] if any remain
                        .trim();
                }

                success = true;
                break; // Exit loop on success

            } catch (err: any) {
                console.warn(`Failed with model ${modelName}:`, err.message);
                lastError = err;
                // If permission denied (403), don't retry other models, it's an API key issue
                if (err.message.includes("403") || err.message.includes("API key")) {
                    break;
                }
                // Continue to next model on 404 or other errors
            }
        }

        if (!success) {
            throw lastError || new Error("Nessun modello disponibile.");
        }

        return NextResponse.json({ result: text });

    } catch (error: any) {
        console.error("Gemini API All Models Failed:", JSON.stringify(error, null, 2));

        // Attempt to list available models to help debugging
        let availableModels = "Impossibile recuperare lista modelli";
        try {
            // Use the properly scoped key
            const apiKey = effectiveKey;

            if (apiKey) {
                const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                const listJson = await listRes.json();
                if (listJson.models) {
                    availableModels = listJson.models.map((m: any) => m.name.replace('models/', '')).join(', ');
                } else {
                    availableModels = JSON.stringify(listJson);
                }
            }
        } catch (listErr) {
            console.error("Failed to list models:", listErr);
            availableModels = `Errore lista: ${listErr}`;
        }

        return NextResponse.json(
            { error: `Errore AI: ${error.message}. MODELLI DISPONIBILI: ${availableModels}` },
            { status: 500 }
        );
    }
}
