import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageData, mimeType } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: "No image data provided" });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType || "image/png", data: imageData }
        },
        {
          type: "text",
          text: `Analiza esta captura de una apuesta deportiva. Devuelve SOLO un JSON válido sin texto extra:
{"match":"equipos","selection":"selección apostada","odds":1.85,"stake":10.00,"bookmaker":"casa de apuestas","sport":"deporte","status":"PENDING"}`
        }
      ]
    }]
  });

  const texto = response.content[0].text.replace(/\`\`\`json|\`\`\`/g, "").trim();
  res.json(JSON.parse(texto));
}
